import { Request, Response, NextFunction } from "express";
import { copyWeekSchema, rotaWeekQuerySchema } from "./rota.schemas";
import { rotaService } from "./rota.service";

export const rotaController = {
  async getWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const query = rotaWeekQuerySchema.parse(req.query);
      const data = await rotaService.getWeek(query.weekStart);
      return res.json(data);
    } catch (err) {
      return next(err);
    }
  },

  async copyWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const body = copyWeekSchema.parse(req.body);
      const actorId = req.user!.id;
      const data = await rotaService.copyWeek(body.fromWeekStart, body.toWeekStart, actorId);
      return res.status(201).json(data);
    } catch (err) {
      return next(err);
    }
  }
};
