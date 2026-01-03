import { z } from "zod";

export const rotaWeekQuerySchema = z.object({
  weekStart: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/)
});
