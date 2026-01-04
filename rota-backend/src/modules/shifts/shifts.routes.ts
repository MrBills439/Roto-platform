import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth";
import { shiftsController } from "./shifts.controller";

export const shiftsRouter = Router();

shiftsRouter.post("/", requireAuth, shiftsController.create);
shiftsRouter.get("/", requireAuth, shiftsController.list);
