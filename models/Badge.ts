import mongoose from "mongoose";
 
const BadgeSchema = new mongoose.Schema(
  {
    badges: {
      badge_id:    String,
      name:        String,
      description: String,
 
      badge_type: {
        type: String,
        enum: ["self-declared", "evidence-backed", "expert-certified", "lesson"],
        required: true,
      },
 
      icon_url: String,
    },
  },
  {
    collection: "badges",
  }
);
 
const Badge =
  mongoose.models.Badge || mongoose.model("Badge", BadgeSchema);
 
export default Badge;