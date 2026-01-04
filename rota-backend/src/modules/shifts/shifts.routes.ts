import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth";
import { shiftsController } from "./shifts.controller";
import { shiftApplicationsController } from "../shiftApplications/shiftApplications.controller";

export const shiftsRouter = Router();

shiftsRouter.post("/", requireAuth, shiftsController.create);
shiftsRouter.get("/", requireAuth, shiftsController.list);
shiftsRouter.post("/:id/apply", requireAuth, shiftApplicationsController.apply);
shiftsRouter.get("/open", requireAuth, shiftsController.listOpen);
