import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

const SECRET = process.env.JWT_SECRET || "dev_secret";

export function signToken(user) {
  return jwt.sign({ sub: user._id, email: user.email }, SECRET, { expiresIn: "7d" });
}

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function requireAuth(req, res) {
  const h = req.headers["authorization"] || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "unauthorized" });
    req.user = user;
    return null;
  } catch (e) {
    return res.status(401).json({ error: "unauthorized" });
  }
}

export function computeLevel(accuracy) {
  if (accuracy < 50) return "bronze";
  if (accuracy <= 80) return "silver";
  return "gold";
}

export async function updateStats(userId, correct, timeTaken) {
  const user = await User.findById(userId);
  const s = user.stats || {};
  const totalGames = (s.totalGames || 0) + 1;
  const totalCorrect = (s.totalCorrect || 0) + (correct ? 1 : 0);
  const accuracy = totalGames ? Math.round((totalCorrect / totalGames) * 100) : 0;
  const avgPrev = s.averageTime || 0;
  const averageTime = avgPrev === 0 ? timeTaken : Math.round(((avgPrev * (totalGames - 1)) + timeTaken) / totalGames);
  const level = computeLevel(accuracy);
  user.stats = { totalGames, totalCorrect, accuracy, averageTime, level };
  await user.save();
  return user.stats;
}