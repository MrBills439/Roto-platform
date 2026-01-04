import { Request, Response, NextFunction } from "express";
import { templatesService } from "./templates.service";
import { applyTemplateSchema, createTemplateSchema, templateIdParamSchema } from "./templates.schemas";

export const templatesController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await templatesService.list();
      return res.json(templates);
    } catch (err) {
      return next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createTemplateSchema.parse(req.body);
      const actorId = req.user!.id;
      const template = await templatesService.createFromWeek(body.name, body.weekStart, actorId);
      return res.status(201).json(template);
    } catch (err) {
      return next(err);
    }
  },

  async apply(req: Request, res: Response, next: NextFunction) {
    try {
      const params = templateIdParamSchema.parse(req.params);
      const body = applyTemplateSchema.parse(req.body);
      const actorId = req.user!.id;
      const result = await templatesService.apply(params.id, body.weekStart, actorId);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  }
};
