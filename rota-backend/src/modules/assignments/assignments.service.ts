import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";
import { addUtcDays, dateAtUtcTime, parseTimeToMinutes, rangesOverlap } from "../../common/utils/time";
import { Prisma } from "@prisma/client";
import { notificationsService } from "../notifications/notifications.service";

type CreateAssignmentInput = {
  shiftId: string;
  staffUserId: string;
  override?: boolean;
  overrideReason?: string;
  autoAccept?: boolean;
};

type UpdateAssignmentInput = {
  shiftId?: string;
  staffUserId?: string;
  override?: boolean;
  overrideReason?: string;
};

const buildShiftRange = (shiftDate: Date, startTime: string, endTime: string) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) {
    throw new ApiError("Invalid shift time format", 400, "INVALID_SHIFT_TIME");
  }
  const start = dateAtUtcTime(shiftDate, startTime);
  if (!start) {
    throw new ApiError("Invalid shift start time", 400, "INVALID_SHIFT_TIME");
  }
  const endDate = endMinutes <= startMinutes ? addUtcDays(shiftDate, 1) : shiftDate;
  const end = dateAtUtcTime(endDate, endTime);
  if (!end) {
    throw new ApiError("Invalid shift end time", 400, "INVALID_SHIFT_TIME");
  }
  return { start, end };
};

const loadStaff = async (staffUserId: string) => {
  const staff = await prisma.user.findUnique({
    where: { id: staffUserId },
    select: { id: true, role: true, isActive: true, firstName: true, lastName: true, gender: true, email: true }
  });
  if (!staff || staff.role !== "STAFF") {
    throw new ApiError("Staff user not found", 404, "STAFF_NOT_FOUND");
  }
  if (!staff.isActive) {
    throw new ApiError("Staff user is inactive", 400, "STAFF_INACTIVE");
  }
  return staff;
};

const loadShift = async (shiftId: string) => {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: {
      id: true,
      name: true,
      shiftDate: true,
      startTime: true,
      endTime: true
    }
  });
  if (!shift) {
    throw new ApiError("Shift not found", 404, "SHIFT_NOT_FOUND");
  }
  return shift;
};

const checkDailyLimit = async (
  staffUserId: string,
  shiftDate: Date,
  override?: boolean,
  overrideReason?: string,
  excludeAssignmentId?: string
) => {
  const dayStart = new Date(
    Date.UTC(shiftDate.getUTCFullYear(), shiftDate.getUTCMonth(), shiftDate.getUTCDate())
  );
  const nextDay = addUtcDays(dayStart, 1);
  const dailyCount = await prisma.assignment.count({
    where: {
      userId: staffUserId,
      ...(excludeAssignmentId ? { id: { not: excludeAssignmentId } } : {}),
      shift: {
        shiftDate: {
          gte: dayStart,
          lt: nextDay
        }
      }
    }
  });

  if (dailyCount >= 2) {
    const hasOverride = override === true && overrideReason && overrideReason.trim().length > 0;
    if (!hasOverride) {
      throw new ApiError("Staff already has two assignments for this day", 409, "DAILY_ASSIGNMENT_LIMIT");
    }
    return { dailyCount, overrideUsed: true };
  }

  return { dailyCount, overrideUsed: false };
};

const checkOverlap = async (staffUserId: string, shift: { shiftDate: Date; startTime: string; endTime: string }, excludeAssignmentId?: string) => {
  const range = buildShiftRange(shift.shiftDate, shift.startTime, shift.endTime);
  const overlapWindowStart = addUtcDays(shift.shiftDate, -1);
  const overlapWindowEnd = addUtcDays(shift.shiftDate, 1);

  const existingAssignments = await prisma.assignment.findMany({
    where: {
      userId: staffUserId,
      ...(excludeAssignmentId ? { id: { not: excludeAssignmentId } } : {}),
      shift: {
        shiftDate: {
          gte: overlapWindowStart,
          lte: overlapWindowEnd
        }
      }
    },
    include: {
      shift: {
        select: {
          shiftDate: true,
          startTime: true,
          endTime: true,
          id: true
        }
      }
    }
  });

  for (const assignment of existingAssignments) {
    const otherRange = buildShiftRange(
      assignment.shift.shiftDate,
      assignment.shift.startTime,
      assignment.shift.endTime
    );
    if (rangesOverlap(range.start, range.end, otherRange.start, otherRange.end)) {
      throw new ApiError(
        `Shift overlaps with existing assignment ${assignment.id}`,
        409,
        "SHIFT_OVERLAP"
      );
    }
  }
};

export const assignmentsService = {
  async list() {
    return prisma.assignment.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        shift: {
          select: {
            id: true,
            name: true,
            shiftType: true,
            shiftDate: true,
            house: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },
  async expirePending() {
    const now = new Date();
    const expired = await prisma.assignment.findMany({
      where: {
        status: "PENDING",
        expiresAt: { lt: now }
      },
      select: { id: true, shiftId: true, assignedById: true }
    });
    if (expired.length === 0) {
      return;
    }

    await prisma.assignment.updateMany({
      where: {
        id: { in: expired.map((item) => item.id) }
      },
      data: {
        status: "EXPIRED",
        respondedAt: now
      }
    });

    // No manager notifications for expiries (reject-only rule).
  },
  async create(input: CreateAssignmentInput, actorId: string) {
    const staff = await loadStaff(input.staffUserId);
    const shift = await loadShift(input.shiftId);

    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        shiftId: input.shiftId,
        userId: input.staffUserId,
        status: { in: ["PENDING", "ACCEPTED"] }
      },
      select: { id: true }
    });
    if (existingAssignment) {
      throw new ApiError("Assignment already exists", 409, "ASSIGNMENT_EXISTS");
    }

    const { overrideUsed } = await checkDailyLimit(
      input.staffUserId,
      shift.shiftDate,
      input.override,
      input.overrideReason
    );
    await checkOverlap(input.staffUserId, shift);

    const expiresAt = input.autoAccept ? null : new Date(Date.now() + 10 * 60 * 1000);
    const assignment = await prisma.assignment.create({
      data: {
        shiftId: input.shiftId,
        userId: input.staffUserId,
        assignedById: actorId,
        createdById: actorId,
        updatedById: actorId,
        status: input.autoAccept ? "ACCEPTED" : "PENDING",
        expiresAt,
        respondedAt: input.autoAccept ? new Date() : null
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "ASSIGNMENT",
        entityId: assignment.id,
        action: "ASSIGN",
        actorId,
        beforeJson: Prisma.JsonNull,

        afterJson: {
          id: assignment.id,
          shiftId: assignment.shiftId,
          staffUserId: assignment.userId,
          assignedById: assignment.assignedById,
          createdAt: assignment.createdAt
        }
      }
    });

    if (overrideUsed) {
      await prisma.auditLog.create({
        data: {
          entityType: "ASSIGNMENT",
          entityId: assignment.id,
          action: "OVERRIDE",
          actorId,
          metadata: {
            reason: input.overrideReason
          }
        }
      });
    }

    await notificationsService.create({
      userId: assignment.userId,
      type: "SHIFT_ASSIGNED",
      title: input.autoAccept ? "Shift assigned" : "Shift assignment pending",
      body: input.autoAccept
        ? `You have been assigned to ${shift.name || "a shift"}.`
        : `Please accept your shift assignment for ${shift.name || "a shift"}.`,
      data: { shiftId: assignment.shiftId, assignmentId: assignment.id, expiresAt }
    });

    return {
      id: assignment.id,
      shiftId: assignment.shiftId,
      staffUserId: assignment.userId,
      staffName: `${staff.firstName} ${staff.lastName}`,
      staffGender: staff.gender
    };
  },

  async remove(id: string, actorId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        user: true,
        shift: {
          select: {
            name: true,
            shiftDate: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
    if (!assignment) {
      throw new ApiError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    await prisma.assignment.delete({ where: { id } });

    await notificationsService.create({
      userId: assignment.userId,
      type: "SHIFT_UNASSIGNED",
      title: "Shift unassigned",
      body: `You have been unassigned from ${assignment.shift.name || "a shift"}.`,
      data: { shiftId: assignment.shiftId, assignmentId: assignment.id }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "ASSIGNMENT",
        entityId: id,
        action: "UNASSIGN",
        actorId,
        beforeJson: {
          id: assignment.id,
          shiftId: assignment.shiftId,
          staffUserId: assignment.userId,
          assignedById: assignment.assignedById,
          createdById: assignment.createdById,
          updatedById: assignment.updatedById,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt,
          shiftDate: assignment.shift.shiftDate,
          startTime: assignment.shift.startTime,
          endTime: assignment.shift.endTime
        },
        afterJson: Prisma.JsonNull

      }
    });

    return { id };
  },

  async update(id: string, input: UpdateAssignmentInput, actorId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        shift: true
      }
    });
    if (!assignment) {
      throw new ApiError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }

    const targetShiftId = input.shiftId ?? assignment.shiftId;
    const targetUserId = input.staffUserId ?? assignment.userId;

    if (targetShiftId === assignment.shiftId && targetUserId === assignment.userId) {
      return assignment;
    }

    const staff = await loadStaff(targetUserId);
    const shift = await loadShift(targetShiftId);

    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        shiftId: targetShiftId,
        userId: targetUserId,
        id: { not: assignment.id },
        status: { in: ["PENDING", "ACCEPTED"] }
      },
      select: { id: true }
    });
    if (existingAssignment) {
      throw new ApiError("Assignment already exists", 409, "ASSIGNMENT_EXISTS");
    }

    const { overrideUsed } = await checkDailyLimit(
      targetUserId,
      shift.shiftDate,
      input.override,
      input.overrideReason,
      assignment.id
    );
    await checkOverlap(targetUserId, shift, assignment.id);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        shiftId: targetShiftId,
        userId: targetUserId,
        assignedById: actorId,
        updatedById: actorId,
        status: "PENDING",
        expiresAt,
        respondedAt: null
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "ASSIGNMENT",
        entityId: updated.id,
        action: "UPDATE",
        actorId,
        beforeJson: {
          id: assignment.id,
          shiftId: assignment.shiftId,
          staffUserId: assignment.userId,
          assignedById: assignment.assignedById,
          createdById: assignment.createdById,
          updatedById: assignment.updatedById,
          createdAt: assignment.createdAt,
          updatedAt: assignment.updatedAt
        },
        afterJson: {
          id: updated.id,
          shiftId: updated.shiftId,
          staffUserId: updated.userId,
          assignedById: updated.assignedById,
          createdById: updated.createdById,
          updatedById: updated.updatedById,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt
        }
      }
    });

    if (overrideUsed) {
      await prisma.auditLog.create({
        data: {
          entityType: "ASSIGNMENT",
          entityId: updated.id,
          action: "OVERRIDE",
          actorId,
          metadata: {
            reason: input.overrideReason
          }
        }
      });
    }

    if (assignment.userId !== updated.userId) {
      await notificationsService.create({
        userId: assignment.userId,
        type: "SHIFT_UNASSIGNED",
        title: "Shift unassigned",
        body: "A shift assignment was moved away from you.",
        data: { assignmentId: assignment.id, shiftId: assignment.shiftId }
      });
      await notificationsService.create({
        userId: updated.userId,
        type: "SHIFT_ASSIGNED",
        title: "Shift assignment pending",
        body: `Please accept your shift assignment for ${shift.name || "a shift"}.`,
        data: { assignmentId: updated.id, shiftId: updated.shiftId, expiresAt }
      });
    } else if (assignment.shiftId !== updated.shiftId) {
      await notificationsService.create({
        userId: updated.userId,
        type: "SHIFT_CHANGED",
        title: "Shift updated",
        body: "Your shift assignment was moved to a different shift. Please accept it again.",
        data: { assignmentId: updated.id, shiftId: updated.shiftId, expiresAt }
      });
    }

    return {
      id: updated.id,
      shiftId: updated.shiftId,
      staffUserId: updated.userId,
      staffName: `${staff.firstName} ${staff.lastName}`,
      staffGender: staff.gender
    };
  },

  async accept(id: string, userId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { shift: true }
    });
    if (!assignment) {
      throw new ApiError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }
    if (assignment.userId !== userId) {
      throw new ApiError("Forbidden", 403, "FORBIDDEN");
    }
    if (assignment.status !== "PENDING") {
      throw new ApiError("Assignment is not pending", 409, "ASSIGNMENT_NOT_PENDING");
    }
    if (assignment.expiresAt && assignment.expiresAt < new Date()) {
      await prisma.assignment.update({
        where: { id },
        data: { status: "EXPIRED", respondedAt: new Date() }
      });
      throw new ApiError("Assignment has expired", 409, "ASSIGNMENT_EXPIRED");
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: { status: "ACCEPTED", respondedAt: new Date(), expiresAt: null }
    });

    // No manager notification on accept (reject-only rule).

    return updated;
  },

  async reject(id: string, userId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: { shift: true }
    });
    if (!assignment) {
      throw new ApiError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    }
    if (assignment.userId !== userId) {
      throw new ApiError("Forbidden", 403, "FORBIDDEN");
    }
    if (assignment.status !== "PENDING") {
      throw new ApiError("Assignment is not pending", 409, "ASSIGNMENT_NOT_PENDING");
    }

    const updated = await prisma.assignment.update({
      where: { id },
      data: { status: "REJECTED", respondedAt: new Date(), expiresAt: null }
    });

    if (assignment.assignedById) {
      await notificationsService.create({
        userId: assignment.assignedById,
        type: "SHIFT_CHANGED",
        title: "Assignment rejected",
        body: "A staff member rejected their assignment.",
        data: { assignmentId: updated.id, shiftId: updated.shiftId }
      });
    }

    return updated;
  }
};
