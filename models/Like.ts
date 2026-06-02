import mongoose from "mongoose";
import { title } from "process";
 
const LikeSchema = new mongoose.Schema(
  {
    Like: {
      like_id:    String,
      user_id:        String,
      post_id: String,
      created_at : { type: Date, default: Date.now }
    },
  },
  {
    collection: "likes",
  }
);

LikeSchema.index({ user_id: 1, post_id: 1 }, { unique: true });
 
const Like =
  mongoose.models.Like || mongoose.model("Like", LikeSchema);
 
export default Like;