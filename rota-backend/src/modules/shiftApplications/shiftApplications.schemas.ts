import { z } from "zod";

export const shiftApplicationIdParamSchema = z.object({
  id: z.string().min(1)
});

export const shiftIdParamSchema = z.object({
  id: z.string().min(1)
});

export const listApplicationsQuerySchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
