import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";
import { addUtcDays, parseDateOnly } from "../../common/utils/time";
import { assignmentsService } from "../assignments/assignments.service";
import { notificationsService } from "../notifications/notifications.service";

export const shiftApplicationsService = {
  async apply(shiftId: string, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, firstName: true, lastName: true }
    });
    if (!user || user.role !== "STAFF") {
      throw new ApiError("Only active staff can apply", 403, "NOT_ELIGIBLE");
    }
    if (!user.isActive) {
      throw new ApiError("Staff user is inactive", 400, "STAFF_INACTIVE");
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) {
      throw new ApiError("Shift not found", 404, "SHIFT_NOT_FOUND");
    }

    const existingAssignment = await prisma.assignment.findFirst({
      where: { shiftId, userId }
    });
    if (existingAssignment) {
      throw new ApiError("Already assigned to shift", 409, "ALREADY_ASSIGNED");
    }

    const existing = await prisma.shiftApplication.findUnique({
      where: { shiftId_userId: { shiftId, userId } }
    });
    if (existing) {
      throw new ApiError("Application already exists", 409, "APPLICATION_EXISTS");
    }

    return prisma.shiftApplication.create({
      data: {
        shiftId,
        userId
      }
    });
  },

  async listForWeek(weekStart: string) {
    const start = parseDateOnly(weekStart);
    if (!start) {
      throw new ApiError("Invalid date", 400, "INVALID_DATE");
    }
    const end = addUtcDays(start, 6);

    return prisma.shiftApplication.findMany({
      where: {
        shift: {
          shiftDate: { gte: start, lte: end }
        }
      },
      include: {
        shift: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async approve(id: string, actorId: string) {
    const application = await prisma.shiftApplication.findUnique({
      where: { id },
      include: { shift: true, user: true }
    });
    if (!application) {
      throw new ApiError("Application not found", 404, "APPLICATION_NOT_FOUND");
    }
    if (application.status !== "PENDING") {
      throw new ApiError("Application already decided", 409, "APPLICATION_DECIDED");
    }

    const assignment = await assignmentsService.create(
      { shiftId: application.shiftId, staffUserId: application.userId, autoAccept: true },
      actorId
    );

    const updated = await prisma.shiftApplication.update({
      where: { id },
      data: { status: "APPROVED", decidedById: actorId, decidedAt: new Date() }
    });

    await notificationsService.create({
      userId: application.userId,
      type: "APPLICATION_APPROVED",
      title: "Shift application approved",
      body: `You have been assigned to ${application.shift.name || "a shift"}.`,
      data: { shiftId: application.shiftId, assignmentId: assignment.id }
    });

    return { application: updated, assignment };
  },

  async reject(id: string, actorId: string) {
    const application = await prisma.shiftApplication.findUnique({
      where: { id },
      include: { shift: true, user: true }
    });
    if (!application) {
      throw new ApiError("Application not found", 404, "APPLICATION_NOT_FOUND");
    }
    if (application.status !== "PENDING") {
      throw new ApiError("Application already decided", 409, "APPLICATION_DECIDED");
    }

    const updated = await prisma.shiftApplication.update({
      where: { id },
      data: { status: "REJECTED", decidedById: actorId, decidedAt: new Date() }
    });

    await notificationsService.create({
      userId: application.userId,
      type: "APPLICATION_REJECTED",
      title: "Shift application rejected",
      body: `Your application for ${application.shift.name || "a shift"} was rejected.`,
      data: { shiftId: application.shiftId }
    });

    return updated;
  }
};
