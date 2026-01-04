import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/middlewares/auth";
import { shiftApplicationsController } from "./shiftApplications.controller";

export const shiftApplicationsRouter = Router();

shiftApplicationsRouter.get(
  "/",
  requireAuth,
  requireRoles("ADMIN", "MANAGER", "TEAM_LEADER"),
  shiftApplicationsController.list
);
shiftApplicationsRouter.post(
  "/:id/approve",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  shiftApplicationsController.approve
);
shiftApplicationsRouter.post(
  "/:id/reject",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  shiftApplicationsController.reject
);
