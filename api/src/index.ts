import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
import { prisma } from "./db.js";

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.get("/events", async (_req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: "asc" },
  });
  res.json(events);
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`API running on port ${port}`));