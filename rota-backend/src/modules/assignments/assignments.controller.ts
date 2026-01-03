import { Request, Response, NextFunction } from "express";
import { createAssignmentSchema, assignmentIdParamSchema } from "./assignments.schemas";
import { assignmentsService } from "./assignments.service";

export const assignmentsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createAssignmentSchema.parse(req.body);
      const actorId = req.user!.id;
      const result = await assignmentsService.create(body, actorId);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const params = assignmentIdParamSchema.parse(req.params);
      const actorId = req.user!.id;
      const result = await assignmentsService.remove(params.id, actorId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
};
