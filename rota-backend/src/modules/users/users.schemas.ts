import { z } from "zod";

const roleEnum = z.enum(["MANAGER", "TEAM_LEADER", "STAFF"]);
const genderEnum = z.enum(["M", "F", "OTHER", "NA"]);

export const userIdParamSchema = z.object({
  id: z.string().min(1)
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: roleEnum,
  phone: z.string().min(3).optional(),
  gender: genderEnum.optional()
});

export const listUsersQuerySchema = z.object({
  role: z.literal("STAFF").optional()
});

export const updateUserSchema = z
  .object({
    isActive: z.boolean().optional(),
    phone: z.string().min(3).optional(),
    gender: genderEnum.optional()
  })
  .refine(
    (data) => data.isActive !== undefined || data.phone !== undefined || data.gender !== undefined,
    { message: "At least one field must be provided" }
  );
