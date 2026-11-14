import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const profileSchema = z.object({
  bgmiName: z.string().trim().max(40).nullable().optional(),
  bgmiId: z.string().trim().max(30).nullable().optional()
}).refine(data => data.bgmiName !== undefined || data.bgmiId !== undefined, {
  message: "At least one profile field is required."
});

router.use(requireAuth);

// Return the signed-in player's profile, statistics, and demo wallet balances.
router.get("/me", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.auth.sub },
      select: {
        id: true, email: true, role: true, bgmiName: true, bgmiId: true, createdAt: true,
        stats: { select: { playedMatches: true, totalWins: true, totalEarningsPaise: true } },
        wallet: { select: { balancePaise: true, winningBalancePaise: true } }
      }
    });
    if (!user) return res.status(404).json({ error: "Player account not found." });
    return res.json({
      user: {
        ...user,
        stats: user.stats || { playedMatches: 0, totalWins: 0, totalEarningsPaise: 0 },
        wallet: user.wallet || { balancePaise: 0, winningBalancePaise: 0 }
      }
    });
  } catch (err) { return next(err); }
});

// Players may update only their own BGMI identity fields.
router.patch("/me", async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid profile details.", details: parsed.error.flatten() });
    }
    const user = await prisma.user.update({
      where: { id: req.auth.sub },
      data: parsed.data,
      select: { id: true, email: true, role: true, bgmiName: true, bgmiId: true }
    });
    return res.json({ user });
  } catch (err) { return next(err); }
});

export default router;
