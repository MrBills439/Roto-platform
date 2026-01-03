import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../env";

export type AuthUser = {
  id: string;
  role: string;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      error: { message: "Unauthorized", code: "UNAUTHORIZED" }
    });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub?: string;
      role?: string;
    };

    if (!payload.sub || !payload.role) {
      return res.status(401).json({
        error: { message: "Unauthorized", code: "UNAUTHORIZED" }
      });
    }

    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({
      error: { message: "Unauthorized", code: "UNAUTHORIZED" }
    });
  }
};

export const requireRoles =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: { message: "Unauthorized", code: "UNAUTHORIZED" }
      });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: { message: "Forbidden", code: "FORBIDDEN" }
      });
    }
    return next();
  };
