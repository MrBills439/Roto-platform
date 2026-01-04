import { z } from "zod";

export const createShiftSchema = z.object({
    name: z.string().min(1, "Shift name is required"),
    houseId: z.string().min(1),
    shiftDate: z.string(),
    shiftType: z.enum(["LONG_DAY", "SLEEP_IN"]),
    startTime: z.string(),
    endTime: z.string(),
  });
  