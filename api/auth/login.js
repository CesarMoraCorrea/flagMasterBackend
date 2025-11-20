import { connectDB } from "../_lib/db.js";
import User from "../_lib/models/User.js";
import { LoginSchema } from "../_lib/validation.js";
import { comparePassword, signToken } from "../_lib/auth.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  await connectDB();
  const body = req.body || await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data || "{}")));
  });
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { email, password } = parsed.data;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "invalid_credentials" });
  const ok = await comparePassword(password, user.password);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });
  const token = signToken(user);
  res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, stats: user.stats } });
}

export default withCors(handler);