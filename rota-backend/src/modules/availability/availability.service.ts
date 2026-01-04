import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";
import { addUtcDays, parseDateOnly } from "../../common/utils/time";
import { notificationsService } from "../notifications/notifications.service";

export const availabilityService = {
  async create(
    userId: string,
    input: { type: "AVAILABLE" | "UNAVAILABLE" | "LEAVE"; startDate: string; endDate: string; notes?: string }
  ) {
    const start = parseDateOnly(input.startDate);
    const end = parseDateOnly(input.endDate);
    if (!start || !end) {
      throw new ApiError("Invalid date", 400, "INVALID_DATE");
    }
    if (start > end) {
      throw new ApiError("startDate must be before endDate", 400, "INVALID_DATE_RANGE");
    }

    const record = await prisma.availability.create({
      data: {
        userId,
        type: input.type,
        startDate: start,
        endDate: end,
        notes: input.notes
      }
    });

    await notificationsService.create({
      userId,
      type: "AVAILABILITY_SUBMITTED",
      title: "Availability submitted",
      body: `Your availability (${input.type}) was submitted.`,
      data: { availabilityId: record.id }
    });

    return record;
  },

  async listForWeek(weekStart: string) {
    const start = parseDateOnly(weekStart);
    if (!start) {
      throw new ApiError("Invalid date", 400, "INVALID_DATE");
    }
    const end = addUtcDays(start, 6);

    return prisma.availability.findMany({
      where: {
        startDate: { lte: end },
        endDate: { gte: start }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: { startDate: "asc" }
    });
  }
};
