import { z } from "zod";

export const houseIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createHouseSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1)
});

export const updateHouseSchema = z
  .object({
    name: z.string().min(1).optional(),
    location: z.string().min(1).optional(),
    isActive: z.boolean().optional()
  })
  .refine(
    (data) => data.name !== undefined || data.location !== undefined || data.isActive !== undefined,
    { message: "At least one field must be provided" }
  );
