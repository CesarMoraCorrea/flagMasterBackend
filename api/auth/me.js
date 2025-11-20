import { connectDB } from "../../lib/db.js";
import { requireAuth } from "../../lib/auth.js";
import { withCors } from "../../lib/cors.js";

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });
  await connectDB();
  const err = await requireAuth(req, res);
  if (err) return;
  const u = req.user;
  res.status(200).json({ user: { id: u._id, name: u.name, email: u.email, avatar: u.avatar, role: u.role, stats: u.stats } });
}

export default withCors(handler);