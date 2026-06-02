import mongoose from "mongoose";

const LikeSchema = new mongoose.Schema(
  {
    like_id: { type: String },
    user_id: { type: String, required: true },
    post_id: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
  },
  {
    collection: "likes",
  }
);

LikeSchema.index({ user_id: 1, post_id: 1 }, { unique: true });
 
const Like = mongoose.models.Like || mongoose.model("Like", LikeSchema);
 
export default Like;