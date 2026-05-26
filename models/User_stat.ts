import mongoose from "mongoose";

const UserStatsSchema = new mongoose.Schema(
  {
    user_stats: {
      user_id: { type: String, ref: "User", required: true }, // FK -> users.user_id

      total_badges_verified:        { type: Number, default: 0 },
      total_self_declared_count:    { type: Number, default: 0 },
      total_evidence_backed_count:  { type: Number, default: 0 },
      total_expert_certified_count: { type: Number, default: 0 },
      total_lesson_badge_count:     { type: Number, default: 0 },
    },
  },
  {
    collection: "user_stats",
  }
);

const UserStats =
  mongoose.models.UserStats || mongoose.model("UserStats", UserStatsSchema);

export default UserStats;