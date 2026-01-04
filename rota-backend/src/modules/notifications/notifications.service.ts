import { prisma } from "../../prisma";

export const notificationsService = {
  async list(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  },

  async markRead(userId: string, id: string) {
    const existing = await prisma.notification.findFirst({
      where: { id, userId }
    });
    if (!existing) {
      return null;
    }
    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() }
    });
  },

  async create(input: {
    userId: string;
    type:
      | "SHIFT_ASSIGNED"
      | "SHIFT_UNASSIGNED"
      | "SHIFT_CHANGED"
      | "APPLICATION_APPROVED"
      | "APPLICATION_REJECTED"
      | "AVAILABILITY_SUBMITTED";
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data
      }
    });
  }
};
