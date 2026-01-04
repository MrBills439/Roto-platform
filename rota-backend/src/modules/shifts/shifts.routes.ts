import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth";
import { prisma } from "../../prisma";

export const shiftsRouter = Router();

/**
 * Create a shift
 */
shiftsRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const { houseId, shiftDate, shiftType, startTime, endTime } = req.body;

    if (!houseId || !shiftDate || !shiftType || !startTime || !endTime) {
      return res.status(400).json({
        error: { message: "Missing required fields", code: "VALIDATION_ERROR" }
      });
    }

    const shift = await prisma.shift.create({
      data: {
        houseId,
        shiftDate: new Date(shiftDate),
        shiftType,
        startTime,
        endTime
      }
    });

    res.status(201).json(shift);
  } catch (err) {
    next(err);
  }
});

/**
 * List shifts
 */
shiftsRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    const shifts = await prisma.shift.findMany({
      include: {
        house: true
      }
    });

    res.json(shifts);
  } catch (err) {
    next(err);
  }
});
