import { connectDB } from "../_lib/db.js";
import User from "../_lib/models/User.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  await connectDB();
  const list = await User.find({}).select("name avatar stats");
  const players = list
    .map((u) => ({ name: u.name, avatar: u.avatar, totalCorrect: u.stats?.totalCorrect || 0, level: u.stats?.level || "bronze", accuracy: u.stats?.accuracy || 0 }))
    .sort((a, b) => {
      if (b.totalCorrect !== a.totalCorrect) return b.totalCorrect - a.totalCorrect;
      return b.accuracy - a.accuracy;
    })
    .slice(0, 100);
  res.status(200).json({ ranking: players });
}

export default withCors(handler);