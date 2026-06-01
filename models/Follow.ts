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
 
const Follow =
  mongoose.models.Follow || mongoose.model("Follow", FollowSchema);
 
export default Follow;