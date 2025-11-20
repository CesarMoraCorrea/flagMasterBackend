import { connectDB } from "../_lib/db.js";
import GameSession from "../_lib/models/GameSession.js";
import { SubmitSchema } from "../_lib/validation.js";
import { requireAuth, updateStats } from "../_lib/auth.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  await connectDB();
  const err = await requireAuth(req, res);
  if (err) return;
  const body = req.body || await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data || "{}")));
  });
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { country, answer, timeTaken } = parsed.data;
  const correct = answer === country;
  const session = await GameSession.create({ userId: req.user._id, country, correct, timeTaken });
  const stats = await updateStats(req.user._id, correct, timeTaken);
  res.status(201).json({ result: { correct }, stats, sessionId: session._id });
}

export default withCors(handler);