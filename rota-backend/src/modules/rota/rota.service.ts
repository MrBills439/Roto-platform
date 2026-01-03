import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    throw new ApiError("Invalid date", 400, "INVALID_DATE");
  }
  return date;
};

const formatDateOnly = (date: Date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const timeToMinutes = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

export const rotaService = {
  async getWeek(weekStartStr: string) {
    const weekStart = parseDateOnly(weekStartStr);
    if (weekStart.getUTCDay() !== 1) {
      throw new ApiError("weekStart must be a Monday", 400, "INVALID_WEEK_START");
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    const houses = await prisma.house.findMany({
      orderBy: { name: "asc" },
      include: {
        shifts: {
          where: {
            shiftDate: {
              gte: weekStart,
              lte: weekEnd
            }
          },
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    gender: true
                  }
                }
              }
            },
            lastEditedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: [{ shiftDate: "asc" }, { startTime: "asc" }]
        }
      }
    });

    return {
      weekStart: formatDateOnly(weekStart),
      weekEnd: formatDateOnly(weekEnd),
      houses: houses.map((house) => ({
        id: house.id,
        name: house.name,
        location: house.location,
        shifts: house.shifts.map((shift) => {
          const endsNextDay = timeToMinutes(shift.endTime) <= timeToMinutes(shift.startTime);
          return {
            id: shift.id,
            shiftDate: formatDateOnly(shift.shiftDate),
            startTime: shift.startTime,
            endTime: shift.endTime,
            endsNextDay,
            shiftType: shift.shiftType,
            assignments: shift.assignments.map((assignment) => ({
              id: assignment.id,
              staffUserId: assignment.user.id,
              staffName: `${assignment.user.firstName} ${assignment.user.lastName}`,
              staffGender: assignment.user.gender
            })),
            lastEditedBy: shift.lastEditedBy
              ? {
                  id: shift.lastEditedBy.id,
                  name: `${shift.lastEditedBy.firstName} ${shift.lastEditedBy.lastName}`
                }
              : undefined,
            lastEditedAt: shift.lastEditedAt ? shift.lastEditedAt.toISOString() : undefined
          };
        })
      }))
    };
  }
};
