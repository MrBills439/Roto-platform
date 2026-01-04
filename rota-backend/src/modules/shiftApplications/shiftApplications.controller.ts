import { Request, Response, NextFunction } from "express";
import { shiftApplicationsService } from "./shiftApplications.service";
import { listApplicationsQuerySchema, shiftApplicationIdParamSchema, shiftIdParamSchema } from "./shiftApplications.schemas";

export const shiftApplicationsController = {
  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const params = shiftIdParamSchema.parse(req.params);
      const userId = req.user!.id;
      const result = await shiftApplicationsService.apply(params.id, userId);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listApplicationsQuerySchema.parse(req.query);
      const result = await shiftApplicationsService.listForWeek(query.weekStart);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const params = shiftApplicationIdParamSchema.parse(req.params);
      const actorId = req.user!.id;
      const result = await shiftApplicationsService.approve(params.id, actorId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  },

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const params = shiftApplicationIdParamSchema.parse(req.params);
      const actorId = req.user!.id;
      const result = await shiftApplicationsService.reject(params.id, actorId);
      return res.json(result);
    } catch (err) {
      return next(err);
    }
  }
};
