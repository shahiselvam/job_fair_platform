import express from "express";
import cors from "cors";
import bcrypt from "bcrypt"
import {signToken , requireAuth, type AuthUser} from "./auth.js";
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
app.post("/register", async (req, res) => {
  const { name, email , password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  if(password.length < 10) {
    return res.status(400).json({ error: "Password must be at least 10 characters long" });
  }
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return res.status(409).json({ error: "Email already in use" });
  }
  
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });
  res.json(user);
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({token: signToken({ id: user.id, role: user.role }),
  user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
  message: "Login successful" });
});
app.get("/auth/me", requireAuth, async (_req, res) => {
  const { id } = res.locals["user"] as AuthUser;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(user);
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`API running on port ${port}`));