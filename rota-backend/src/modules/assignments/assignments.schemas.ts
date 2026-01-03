import { z } from "zod";

export const assignmentIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createAssignmentSchema = z.object({
  shiftId: z.string().min(1),
  staffUserId: z.string().min(1),
  override: z.boolean().optional().default(false),
  overrideReason: z.string().optional()
});
