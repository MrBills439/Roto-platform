import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const applyTemplateSchema = z.object({
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const templateIdParamSchema = z.object({
  id: z.string().min(1)
});
