import mongoose from "mongoose";

const UserBadgeSchema = new mongoose.Schema(
  {
    user_badges: {
      user_badge_id: String,

      user_id:  { type: String, ref: "User",  required: true }, // FK -> users.user_id
      badge_id: { type: String, ref: "Badge", required: true }, // FK -> badges.badge_id

      status: {
        type:     String,
        enum:     ["pending", "verified", "declined"],
        default:  "pending",
        required: true,
      },

      evidence_url:   String,
      user_note:      String,

      admin_id:       { type: String, ref: "User" }, // FK -> users.user_id
      admin_comment:  String,

      submitted_at: { type: Date, default: Date.now },
      verified_at:  { type: Date, default: null },

      badge_type_snapshot: {
        type: String,
        enum: ["self-declared", "evidence-backed", "expert-certified", "lesson"],
      },
    },
  },
  {
    collection: "user_badges",
  }
);

const UserBadge =
  mongoose.models.UserBadge || mongoose.model("UserBadge", UserBadgeSchema);

export default UserBadge;