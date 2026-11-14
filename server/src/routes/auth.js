import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const credentials = z.object({
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(8).max(72)
});

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role, bgmiName: user.bgmiName, bgmiId: user.bgmiId };
}
function makeToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    algorithm: "HS256", expiresIn: "2h", issuer: "gaming-monk-api", audience: "gaming-monk"
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and password (minimum 8 characters)." });
    const { email, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(password, 12);
    // Public registration can only create PLAYER accounts. Never accept a role from the client.
    const user = await prisma.user.create({ data: { email, passwordHash, role: "PLAYER" } });
    return res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { return next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and password." });
    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!valid) return res.status(401).json({ error: "Email or password is incorrect." });
    return res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { return next(err); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth.sub } });
    if (!user) return res.status(401).json({ error: "Account not found." });
    return res.json({ user: publicUser(user) });
  } catch (err) { return next(err); }
});

export default router;