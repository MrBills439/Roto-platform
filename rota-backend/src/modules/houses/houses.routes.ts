import { Router } from "express";
import { housesController } from "./houses.controller";
import { requireAuth, requireRoles } from "../../common/middlewares/auth";

export const housesRouter = Router();

housesRouter.get("/", requireAuth, housesController.list);
housesRouter.post(
  "/",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  housesController.create
);
housesRouter.patch(
  "/:id",
  requireAuth,
  requireRoles("ADMIN", "MANAGER"),
  housesController.update
);
