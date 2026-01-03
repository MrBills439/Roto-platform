import bcrypt from "bcrypt";
import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";

export const usersService = {
  async create(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: "MANAGER" | "TEAM_LEADER" | "STAFF";
      phone?: string;
      gender?: "M" | "F" | "OTHER" | "NA";
    },
    actorId: string
  ) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ApiError("Email already in use", 409, "EMAIL_IN_USE");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        gender: data.gender
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        gender: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: user.id,
        action: "CREATE",
        actorId
      }
    });

    return user;
  },

  async listStaff() {
    return prisma.user.findMany({
      where: { role: "STAFF" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        gender: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });
  },

  async update(
    id: string,
    data: { isActive?: boolean; phone?: string; gender?: "M" | "F" | "OTHER" | "NA" },
    actorId: string
  ) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("User not found", 404, "USER_NOT_FOUND");
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        gender: true,
        phone: true,
        isActive: true,
        createdAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "USER",
        entityId: user.id,
        action: "UPDATE",
        actorId
      }
    });

    return user;
  }
};
