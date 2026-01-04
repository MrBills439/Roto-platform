import { ShiftType } from "@prisma/client";
import { z } from "zod";

export const createShiftSchema = z.object({
    name: z.string().min(1, "Shift name is required"),
    houseId: z.string().min(1),
    shiftDate: z.string(),
    shiftType: z.nativeEnum(ShiftType),
    startTime: z.string(),
    endTime: z.string(),
  });
  