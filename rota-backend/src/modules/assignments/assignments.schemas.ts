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

export const updateAssignmentSchema = z
  .object({
    shiftId: z.string().min(1).optional(),
    staffUserId: z.string().min(1).optional(),
    override: z.boolean().optional().default(false),
    overrideReason: z.string().optional()
  })
  .refine((data) => data.shiftId || data.staffUserId, {
    message: "At least one field must be provided"
  });

export const assignmentActionParamSchema = z.object({
  id: z.string().min(1)
});
