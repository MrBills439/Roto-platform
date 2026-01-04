import { z } from "zod";

export const rotaWeekQuerySchema = z.object({
  weekStart: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)
});

export const copyWeekSchema = z.object({
  fromWeekStart: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  toWeekStart: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)
});
