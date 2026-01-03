import { Request, Response, NextFunction } from "express";
import { rotaWeekQuerySchema } from "./rota.schemas";
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
  }
};
