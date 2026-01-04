import { z } from "zod";

export const createAvailabilitySchema = z.object({
  type: z.enum(["AVAILABLE", "UNAVAILABLE", "LEAVE"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional()
});

export const listAvailabilityQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
