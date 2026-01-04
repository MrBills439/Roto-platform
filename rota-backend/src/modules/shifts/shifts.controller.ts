import { Request, Response, NextFunction } from "express";
import { shiftsService } from "./shifts.service";
import { createShiftSchema } from "./shifts.schemas";

export const shiftsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createShiftSchema.parse(req.body);
      const shift = await shiftsService.create(input);
      return res.status(201).json(shift);
    } catch (err) {
      return next(err);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const shifts = await shiftsService.list();
      return res.json(shifts);
    } catch (err) {
      return next(err);
    }
  },
};
