import { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service";
import { createUserSchema, listUsersQuerySchema, updateUserSchema, userIdParamSchema } from "./users.schemas";
import { ApiError } from "../../common/errors/ApiError";

export const usersController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createUserSchema.parse(req.body);
      const actorId = req.user!.id;
      const user = await usersService.create(body, actorId);
      return res.status(201).json(user);
    } catch (err) {
      return next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listUsersQuerySchema.parse(req.query);
      if (query.role && query.role !== "STAFF") {
        throw new ApiError("Only STAFF role is supported", 400, "INVALID_QUERY");
      }
      const users = await usersService.listStaff();
      return res.json(users);
    } catch (err) {
      return next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const params = userIdParamSchema.parse(req.params);
      const body = updateUserSchema.parse(req.body);
      const actorId = req.user!.id;
      const user = await usersService.update(params.id, body, actorId);
      return res.json(user);
    } catch (err) {
      return next(err);
    }
  }
};
