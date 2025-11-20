import { connectDB } from "../_lib/db.js";
import User from "../_lib/models/User.js";
import { RegisterSchema } from "../_lib/validation.js";
import { hashPassword, signToken } from "../_lib/auth.js";
import { withCors } from "../_lib/cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  await connectDB();
  const body = req.body || await new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(JSON.parse(data || "{}")));
  });
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { name, email, password, avatar } = parsed.data;
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "email_in_use" });
  const hashed = await hashPassword(password);
  const user = await User.create({ name, email, password: hashed, avatar });
  const token = signToken(user);
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role, stats: user.stats } });
}

export default withCors(handler);