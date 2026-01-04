import { Request, Response, NextFunction } from "express";
import { availabilityService } from "./availability.service";
import { createAvailabilitySchema, listAvailabilityQuerySchema } from "./availability.schemas";

export const availabilityController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createAvailabilitySchema.parse(req.body);
      const userId = req.user!.id;
      const record = await availabilityService.create(userId, body);
      return res.status(201).json(record);
    } catch (err) {
      return next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listAvailabilityQuerySchema.parse(req.query);
      const records = await availabilityService.listForWeek(query.weekStart);
      return res.json(records);
    } catch (err) {
      return next(err);
    }
  }
};
