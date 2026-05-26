import mongoose from "mongoose";
 
const CommentSchema = new mongoose.Schema(
  {
    comment: {
      comment_id:    String,
      post_id:        String,
      user_id: String,
      videoUrl: String,
      content : String,
      created_at : { type: Date, default: Date.now }
    },
  },
  {
    collection: "comments",
  }
);
 
const Comment =
  mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
 
export default Comment;