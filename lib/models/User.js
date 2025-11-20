import mongoose, { Schema } from "mongoose";

const StatsSchema = new Schema({
  totalGames: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  accuracy: { type: Number, default: 0 },
  averageTime: { type: Number, default: 0 },
  level: { type: String, default: "bronze" }
});

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, default: "player" },
    stats: { type: StatsSchema, default: () => ({}) }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);