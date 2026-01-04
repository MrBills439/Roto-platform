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

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
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
            requiredStaffCount: shift.requiredStaffCount,
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
  },

  async copyWeek(fromWeekStart: string, toWeekStart: string, actorId: string) {
    const from = parseDateOnly(fromWeekStart);
    const to = parseDateOnly(toWeekStart);
    if (!from || !to) {
      throw new ApiError("Invalid date", 400, "INVALID_DATE");
    }
    if (from.getUTCDay() !== 1 || to.getUTCDay() !== 1) {
      throw new ApiError("weekStart must be a Monday", 400, "INVALID_WEEK_START");
    }
    const fromEnd = addDays(from, 6);

    const shifts = await prisma.shift.findMany({
      where: { shiftDate: { gte: from, lte: fromEnd } }
    });
    if (shifts.length === 0) {
      throw new ApiError("No shifts found for source week", 404, "NO_SHIFTS");
    }

    const created = await prisma.$transaction(
      shifts.map((shift) => {
        const dayOffset = Math.floor((shift.shiftDate.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
        const shiftDate = addDays(to, dayOffset);
        return prisma.shift.create({
          data: {
            houseId: shift.houseId,
            name: shift.name,
            shiftType: shift.shiftType,
            shiftDate,
            startTime: shift.startTime,
            endTime: shift.endTime,
            requiredStaffCount: shift.requiredStaffCount,
            notes: shift.notes,
            lastEditedById: actorId,
            lastEditedAt: new Date()
          }
        });
      })
    );

    return created;
  }
};
