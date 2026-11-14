import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import tournamentRoutes from "./routes/tournaments.js";
import { prisma } from "./db.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters");
}

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || false }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }));
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "gaming-monk-api" }));
app.get("/api/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error);
    return res.status(503).json({ ok: false, database: "unavailable" });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "P2002") return res.status(409).json({ error: "This account already exists." });
  return res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => console.log(`Gaming Monk API listening on port ${port}`));
async function shutdown() {
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);