import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma";
import { env } from "../../env";


export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: { message: "email and password are required", code: "VALIDATION_ERROR" } });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: { message: "Invalid credentials", code: "INVALID_CREDENTIALS" } });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: { message: "Invalid credentials", code: "INVALID_CREDENTIALS" } });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      accessToken: token,
      user: { id: user.id, role: user.role, fullName: `${user.firstName} ${user.lastName}`
      , email: user.email }
    });
  } catch (err) {
    return next(err);
  }
});
