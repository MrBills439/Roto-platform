import { Request, Response, NextFunction } from "express";
import { notificationsService } from "./notifications.service";
import { notificationIdParamSchema } from "./notifications.schemas";

export const notificationsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const items = await notificationsService.list(userId);
      return res.json(items);
    } catch (err) {
      return next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const params = notificationIdParamSchema.parse(req.params);
      const userId = req.user!.id;
      const item = await notificationsService.markRead(userId, params.id);
      if (!item) {
        return res.status(404).json({ error: { message: "Notification not found", code: "NOTIFICATION_NOT_FOUND" } });
      }
      return res.json(item);
    } catch (err) {
      return next(err);
    }
  }
};
