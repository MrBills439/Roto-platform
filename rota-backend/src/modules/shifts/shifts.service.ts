import { ShiftType } from "@prisma/client";
import { prisma } from "../../prisma";

export type CreateShiftInput = {
  name: string;
  houseId: string;
  shiftDate: string; // ISO date e.g. "2026-01-06"
  shiftType: ShiftType;
  startTime: string; // "08:00"
  endTime: string;   // "20:00"
};

export const shiftsService = {
  async create(input: CreateShiftInput) {
    const { name, houseId, shiftDate, shiftType, startTime, endTime } = input;

    return prisma.shift.create({
      data: {
        name,
        houseId,
        shiftDate: new Date(shiftDate),
        shiftType,
        startTime,
        endTime,
      },
    });
  },

  async list() {
    return prisma.shift.findMany({
      orderBy: { shiftDate: "asc" },
    });
  },
};
