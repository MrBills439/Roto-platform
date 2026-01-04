import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/users.routes";
import { housesRouter } from "./modules/houses/houses.routes";
import { shiftsRouter } from "./modules/shifts/shifts.routes";
import { assignmentsRouter } from "./modules/assignments/assignments.routes";
import { rotaRouter } from "./modules/rota/rota.routes";
import { auditRouter } from "./modules/audit/audit.routes";
import { availabilityRouter } from "./modules/availability/availability.routes";
import { templatesRouter } from "./modules/templates/templates.routes";
import { notificationsRouter } from "./modules/notifications/notifications.routes";
import { shiftApplicationsRouter } from "./modules/shiftApplications/shiftApplications.routes";

export const routes = Router();

routes.use("/auth", authRouter);
routes.use("/users", usersRouter);
routes.use("/houses", housesRouter);
routes.use("/shifts", shiftsRouter);
routes.use("/assignments", assignmentsRouter);
routes.use("/rota", rotaRouter);
routes.use("/audit", auditRouter);
routes.use("/availability", availabilityRouter);
routes.use("/templates", templatesRouter);
routes.use("/notifications", notificationsRouter);
routes.use("/shift-applications", shiftApplicationsRouter);
