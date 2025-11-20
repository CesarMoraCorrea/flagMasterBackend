import "dotenv/config";
import express from "express";
import cors from "cors";

import register from "./api/auth/register.js";
import login from "./api/auth/login.js";
import me from "./api/auth/me.js";
import countries from "./api/game/countries.js";
import submit from "./api/game/submit.js";
import history from "./api/game/history.js";
import ranking from "./api/game/ranking.js";
import { connectDB } from "./api/_lib/db.js";
import User from "./api/_lib/models/User.js";
import { hashPassword } from "./api/_lib/auth.js";

const app = express();
app.use(cors({ origin: process.env.API_BASE_URL || "http://localhost:5173" }));
app.use(express.json());

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: "internal_error" });
    }
  };
}

app.post("/api/auth/register", wrap(register));
app.post("/api/auth/login", wrap(login));
app.get("/api/auth/me", wrap(me));

app.get("/api/game/countries", wrap(countries));
app.post("/api/game/submit", wrap(submit));
app.get("/api/game/history", wrap(history));
app.delete("/api/game/history", wrap(history));
app.get("/api/game/ranking", wrap(ranking));

const port = process.env.PORT || 3001;
async function seed() {
  await connectDB();
  const email = process.env.SEED_EMAIL || "cesar@gmail.com";
  const exists = await User.findOne({ email });
  if (!exists) {
    const password = await hashPassword(process.env.SEED_PASSWORD || "123456");
    await User.create({ name: process.env.SEED_NAME || "Cesar", email, password });
  }
}

seed().then(() => {
  app.listen(port, () => {
    console.log(`Flag Master API local running on http://localhost:${port}`);
  });
});