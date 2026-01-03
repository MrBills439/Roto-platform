import { Router } from "express";
import { rotaController } from "./rota.controller";
import { requireAuth, requireRoles } from "../../common/middlewares/auth";

export const rotaRouter = Router();

rotaRouter.get(
  "/week",
  requireAuth,
  requireRoles("ADMIN", "MANAGER", "TEAM_LEADER"),
  rotaController.getWeek
);
