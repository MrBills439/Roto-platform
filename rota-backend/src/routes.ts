import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { housesRouter } from "./modules/houses/houses.routes";
import { shiftsRouter } from "./modules/shifts/shifts.routes";
import { assignmentsRouter } from "./modules/assignments/assignments.routes";
import { rotaRouter } from "./modules/rota/rota.routes";
import { auditRouter } from "./modules/audit/audit.routes";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use("/users", usersRouter);
routes.use("/houses", housesRouter);
routes.use("/shifts", shiftsRouter);
routes.use("/assignments", assignmentsRouter);
routes.use("/rota", rotaRouter);
routes.use("/audit", auditRouter);
