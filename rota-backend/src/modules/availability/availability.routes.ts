import { Router } from "express";
import { requireAuth, requireRoles } from "../../common/middlewares/auth";
import { availabilityController } from "./availability.controller";

export const availabilityRouter = Router();

availabilityRouter.post("/", requireAuth, availabilityController.create);
availabilityRouter.get(
  "/",
  requireAuth,
  requireRoles("ADMIN", "MANAGER", "TEAM_LEADER"),
  availabilityController.list
);
