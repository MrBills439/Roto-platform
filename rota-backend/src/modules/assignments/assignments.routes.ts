import { Router } from "express";
import { assignmentsController } from "./assignments.controller";
import { requireAuth, requireRoles } from "../../common/middlewares/auth";

export const assignmentsRouter = Router();

assignmentsRouter.post(
  "/",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  assignmentsController.create
);
assignmentsRouter.delete(
  "/:id",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  assignmentsController.remove
);
