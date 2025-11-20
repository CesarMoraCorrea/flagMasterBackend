import { connectDB } from "../../lib/db.js";
import GameSession from "../../lib/models/GameSession.js";
import User from "../../lib/models/User.js";
import { requireAuth } from "../../lib/auth.js";
import { withCors } from "../../lib/cors.js";

async function handler(req, res) {
  await connectDB();
  const err = await requireAuth(req, res);
  if (err) return;
  if (req.method === "GET") {
    const items = await GameSession.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ history: items });
  }
  if (req.method === "DELETE") {
    await GameSession.deleteMany({ userId: req.user._id });
    const user = await User.findById(req.user._id);
    user.stats = { totalGames: 0, totalCorrect: 0, accuracy: 0, averageTime: 0, level: "bronze" };
    await user.save();
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: "method_not_allowed" });
}

export default withCors(handler);