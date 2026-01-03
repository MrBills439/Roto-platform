import { prisma } from "../../prisma";
import { ApiError } from "../../common/errors/ApiError";

export const housesService = {
  async list() {
    return prisma.house.findMany({
      orderBy: { name: "asc" }
    });
  },

  async create(data: { name: string; location: string }, actorId: string) {
    const house = await prisma.house.create({
      data
    });

    await prisma.auditLog.create({
      data: {
        entityType: "HOUSE",
        entityId: house.id,
        action: "CREATE",
        actorId
      }
    });

    return house;
  },

  async update(
    id: string,
    data: { name?: string; location?: string; isActive?: boolean },
    actorId: string
  ) {
    const existing = await prisma.house.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("House not found", 404, "HOUSE_NOT_FOUND");
    }

    const house = await prisma.house.update({
      where: { id },
      data
    });

    await prisma.auditLog.create({
      data: {
        entityType: "HOUSE",
        entityId: house.id,
        action: "UPDATE",
        actorId
      }
    });

    return house;
  }
};
