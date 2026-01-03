import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";
import { addUtcDays, dateAtUtcTime, parseTimeToMinutes, rangesOverlap } from "../../common/utils/time";

type CreateAssignmentInput = {
  shiftId: string;
  staffUserId: string;
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

export const assignmentsService = {
  async create(input: CreateAssignmentInput, actorId: string) {
    const staff = await prisma.user.findUnique({
      where: { id: input.staffUserId },
      select: { id: true, role: true, isActive: true, firstName: true, lastName: true, gender: true }
    });
    if (!staff || staff.role !== "STAFF") {
      throw new ApiError("Staff user not found", 404, "STAFF_NOT_FOUND");
    }
    if (!staff.isActive) {
      throw new ApiError("Staff user is inactive", 400, "STAFF_INACTIVE");
    }

    const shift = await prisma.shift.findUnique({
      where: { id: input.shiftId },
      select: {
        id: true,
        shiftDate: true,
        startTime: true,
        endTime: true
      }
    });
    if (!shift) {
      throw new ApiError("Shift not found", 404, "SHIFT_NOT_FOUND");
    }

    const existingAssignment = await prisma.assignment.findFirst({
      where: { shiftId: input.shiftId, userId: input.staffUserId },
      select: { id: true }
    });
    if (existingAssignment) {
      throw new ApiError("Assignment already exists", 409, "ASSIGNMENT_EXISTS");
    }

    const dayStart = new Date(Date.UTC(shift.shiftDate.getUTCFullYear(), shift.shiftDate.getUTCMonth(), shift.shiftDate.getUTCDate()));
    const nextDay = addUtcDays(dayStart, 1);
    const dailyCount = await prisma.assignment.count({
      where: {
        userId: input.staffUserId,
        shift: {
          shiftDate: {
            gte: dayStart,
            lt: nextDay
          }
        }
      }
    });

    if (dailyCount >= 2) {
      const hasOverride = input.override === true && input.overrideReason && input.overrideReason.trim().length > 0;
      if (!hasOverride) {
        throw new ApiError("Staff already has two assignments for this day", 409, "DAILY_ASSIGNMENT_LIMIT");
      }
    }

    const range = buildShiftRange(shift.shiftDate, shift.startTime, shift.endTime);
    const overlapWindowStart = addUtcDays(shift.shiftDate, -1);
    const overlapWindowEnd = addUtcDays(shift.shiftDate, 1);

    const existingAssignments = await prisma.assignment.findMany({
      where: {
        userId: input.staffUserId,
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

    const assignment = await prisma.assignment.create({
      data: {
        shiftId: input.shiftId,
        userId: input.staffUserId,
        assignedById: actorId,
        createdById: actorId,
        updatedById: actorId
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "ASSIGNMENT",
        entityId: assignment.id,
        action: "ASSIGN",
        actorId,
        beforeJson: null,
        afterJson: {
          id: assignment.id,
          shiftId: assignment.shiftId,
          staffUserId: assignment.userId,
          assignedById: assignment.assignedById,
          createdAt: assignment.createdAt
        }
      }
    });

    if (dailyCount >= 2) {
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
        shift: {
          select: {
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
        afterJson: null
      }
    });

    return { id };
  }
};
