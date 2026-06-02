import mongoose from "mongoose";
 
const FollowSchema = new mongoose.Schema(
  {
    comment: {
      follow_id:    String,
      follow_user_id:        String,
      following_user_id: String,
      created_at : { type: Date, default: Date.now }
    },
  },
  {
    collection: "follows",
  }
);

FollowSchema.index({ follower_id: 1, following_id: 1 },{ unique: true });

const Follow =
  mongoose.models.Follow || mongoose.model("Follow", FollowSchema);
 
export default Follow;