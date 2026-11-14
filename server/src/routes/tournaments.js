import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

const createTournamentSchema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().max(1000).optional(),
  mode: z.enum(["SOLO", "DUO", "SQUAD"]),
  map: z.string().trim().min(2).max(40).default("Erangel"),
  entryFeeRupees: z.number().int().min(0).max(1000000).default(0),
  prizePoolRupees: z.number().int().min(0).max(10000000).default(0),
  maxTeams: z.number().int().min(1).max(500),
  startsAt: z.string().datetime().optional()
});

// Public tournament catalogue. Money values are display metadata only; no payment is taken.
router.get("/", async (req, res, next) => {
  try {
    const mode = req.query.mode;
    if (mode && !["SOLO", "DUO", "SQUAD"].includes(mode)) {
      return res.status(400).json({ error: "Mode must be SOLO, DUO, or SQUAD." });
    }
    const status = req.query.status;
    if (status && !["UPCOMING", "LIVE", "COMPLETED"].includes(status)) {
      return res.status(400).json({ error: "Invalid tournament status." });
    }
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: status || { in: ["UPCOMING", "LIVE", "COMPLETED"] },
        ...(mode ? { mode } : {})
      },
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true, title: true, description: true, mode: true, status: true, map: true,
        entryFeePaise: true, prizePoolPaise: true, maxTeams: true, startsAt: true, createdAt: true,
        _count: { select: { entries: true } }
      }
    });
    return res.json({ tournaments });
  } catch (err) { return next(err); }
});

// Only trusted admin accounts can publish tournament records.
router.post("/", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), async (req, res, next) => {
  try {
    const parsed = createTournamentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid tournament details.", details: parsed.error.flatten() });
    }
    const data = parsed.data;
    const tournament = await prisma.tournament.create({
      data: {
        title: data.title,
        description: data.description,
        mode: data.mode,
        map: data.map,
        entryFeePaise: data.entryFeeRupees * 100,
        prizePoolPaise: data.prizePoolRupees * 100,
        maxTeams: data.maxTeams,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        status: "DRAFT",
        createdById: req.auth.sub
      },
      select: {
        id: true, title: true, mode: true, status: true, map: true,
        entryFeePaise: true, prizePoolPaise: true, maxTeams: true, startsAt: true
      }
    });
    return res.status(201).json({ tournament });
  } catch (err) { return next(err); }
});

export default router;
