import { Router } from "express";
import { usersController } from "./users.controller";
import { requireAuth, requireRoles } from "../../common/middlewares/auth";

export const usersRouter = Router();

usersRouter.post("/", requireAuth, requireRoles("ADMIN"), usersController.create);
usersRouter.get("/", requireAuth, requireRoles("ADMIN", "MANAGER"), usersController.list);
usersRouter.patch("/:id", requireAuth, requireRoles("ADMIN"), usersController.update);
