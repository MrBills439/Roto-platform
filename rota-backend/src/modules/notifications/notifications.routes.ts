import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth";
import { notificationsController } from "./notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, notificationsController.list);
notificationsRouter.patch("/:id/read", requireAuth, notificationsController.markRead);
