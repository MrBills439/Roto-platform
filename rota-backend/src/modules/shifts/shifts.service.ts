import { ShiftType } from "@prisma/client";
import { prisma } from "../../prisma";

export type CreateShiftInput = {
  name: string;
  houseId: string;
  shiftDate: string; // ISO date e.g. "2026-01-06"
  shiftType: ShiftType;
  startTime: string; // "08:00"
  endTime: string;   // "20:00"
  requiredStaffCount?: number;
};

export const shiftsService = {
  async create(input: CreateShiftInput) {
    const { name, houseId, shiftDate, shiftType, startTime, endTime, requiredStaffCount } = input;

    return prisma.shift.create({
      data: {
        name,
        houseId,
        shiftDate: new Date(shiftDate),
        shiftType,
        startTime,
        endTime,
        requiredStaffCount: requiredStaffCount ?? 1
      },
    });
  },

  async list() {
    return prisma.shift.findMany({
      orderBy: { shiftDate: "asc" },
    });
  },

  async listOpen(start: Date, end: Date) {
    const shifts = await prisma.shift.findMany({
      where: { shiftDate: { gte: start, lte: end } },
      include: {
        assignments: {
          where: { status: "ACCEPTED" },
          select: { id: true }
        }
      },
      orderBy: { shiftDate: "asc" }
    });

    return shifts
      .filter((shift) => shift.assignments.length < shift.requiredStaffCount)
      .map((shift) => {
        const { assignments, ...rest } = shift;
        return {
          ...rest,
          assignedCount: assignments.length,
          openSlots: shift.requiredStaffCount - assignments.length
        };
      });
  }
};
