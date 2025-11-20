import mongoose, { Schema } from "mongoose";

const GameSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    country: { type: String, required: true },
    correct: { type: Boolean, required: true },
    timeTaken: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.models.GameSession || mongoose.model("GameSession", GameSessionSchema);