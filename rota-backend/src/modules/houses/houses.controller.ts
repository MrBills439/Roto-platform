import { Request, Response, NextFunction } from "express";
import { housesService } from "./houses.service";
import { createHouseSchema, houseIdParamSchema, updateHouseSchema } from "./houses.schemas";

export const housesController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const houses = await housesService.list();
      return res.json(houses);
    } catch (err) {
      return next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createHouseSchema.parse(req.body);
      const actorId = req.user!.id;
      const house = await housesService.create(body, actorId);
      return res.status(201).json(house);
    } catch (err) {
      return next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = houseIdParamSchema.parse(req.params);
      const body = updateHouseSchema.parse(req.body);
      const actorId = req.user!.id;
      const house = await housesService.update(params.id, body, actorId);
      return res.json(house);
    } catch (err) {
      return next(err);
    }
  }
};
