import { Request, Response, NextFunction } from "express";
import {
  createAssignmentSchema,
  assignmentIdParamSchema,
  assignmentActionParamSchema,
  updateAssignmentSchema
} from "./assignments.schemas";
import { assignmentsService } from "./assignments.service";

export const assignmentsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assignmentsService.list();
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },
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
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = assignmentIdParamSchema.parse(req.params);
      const body = updateAssignmentSchema.parse(req.body);
      const actorId = req.user!.id;
      const result = await assignmentsService.update(params.id, body, actorId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const params = assignmentActionParamSchema.parse(req.params);
      const userId = req.user!.id;
      const result = await assignmentsService.accept(params.id, userId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const params = assignmentActionParamSchema.parse(req.params);
      const userId = req.user!.id;
      const result = await assignmentsService.reject(params.id, userId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
};
