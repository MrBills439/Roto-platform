import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";
import { addUtcDays, parseDateOnly } from "../../common/utils/time";

export const templatesService = {
  async list() {
    return prisma.shiftTemplate.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" }
    });
  },

  async createFromWeek(name: string, weekStart: string, actorId: string) {
    const start = parseDateOnly(weekStart);
    if (!start) {
      throw new ApiError("Invalid date", 400, "INVALID_DATE");
    }
    if (start.getUTCDay() !== 1) {
      throw new ApiError("weekStart must be a Monday", 400, "INVALID_WEEK_START");
    }
    const end = addUtcDays(start, 6);

    const shifts = await prisma.shift.findMany({
      where: { shiftDate: { gte: start, lte: end } },
      orderBy: { shiftDate: "asc" }
    });

    if (shifts.length === 0) {
      throw new ApiError("No shifts found for week", 404, "NO_SHIFTS");
    }

    return prisma.shiftTemplate.create({
      data: {
        name,
        createdById: actorId,
        items: {
          create: shifts.map((shift) => {
            const dayOfWeek = shift.shiftDate.getUTCDay();
            return {
              houseId: shift.houseId,
              name: shift.name,
              shiftType: shift.shiftType,
              startTime: shift.startTime,
              endTime: shift.endTime,
              requiredStaffCount: shift.requiredStaffCount,
              dayOfWeek
            };
          })
        }
      },
      include: { items: true }
    });
  },

  async apply(templateId: string, weekStart: string, actorId: string) {
    const start = parseDateOnly(weekStart);
    if (!start) {
      throw new ApiError("Invalid date", 400, "INVALID_DATE");
    }
    if (start.getUTCDay() !== 1) {
      throw new ApiError("weekStart must be a Monday", 400, "INVALID_WEEK_START");
    }

    const template = await prisma.shiftTemplate.findUnique({
      where: { id: templateId },
      include: { items: true }
    });
    if (!template) {
      throw new ApiError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }

    const created = await prisma.$transaction(
      template.items.map((item) => {
        const shiftDate = addUtcDays(start, item.dayOfWeek === 0 ? 6 : item.dayOfWeek - 1);
        return prisma.shift.create({
          data: {
            houseId: item.houseId,
            name: item.name,
            shiftType: item.shiftType,
            shiftDate,
            startTime: item.startTime,
            endTime: item.endTime,
            requiredStaffCount: item.requiredStaffCount,
            lastEditedById: actorId,
            lastEditedAt: new Date()
          }
        });
      })
    );

    return created;
  }
};
