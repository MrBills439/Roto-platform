import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/middlewares/auth";
import { templatesController } from "./templates.controller";

export const templatesRouter = Router();

templatesRouter.get(
  "/",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  templatesController.list
);
templatesRouter.post(
  "/",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  templatesController.create
);
templatesRouter.post(
  "/:id/apply",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  templatesController.apply
);
