import { Request, Response, NextFunction } from "express";
import { shiftsService } from "./shifts.service";
import { createShiftSchema, listOpenShiftsQuerySchema } from "./shifts.schemas";
import { ApiError } from "../../common/errors/ApiError";
import { addUtcDays, parseDateOnly } from "../../common/utils/time";

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

  async listOpen(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listOpenShiftsQuerySchema.parse(req.query);
      const start = parseDateOnly(query.weekStart);
      if (!start) {
        throw new ApiError("Invalid date", 400, "INVALID_DATE");
      }
      const end = addUtcDays(start, 6);
      const shifts = await shiftsService.listOpen(start, end);
      return res.json(shifts);
    } catch (err) {
      return next(err);
    }
  }
};
