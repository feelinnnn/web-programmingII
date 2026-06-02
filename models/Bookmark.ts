import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema(
  {
    bookmark: {
      bookmark_id:    String,
      user_id:        String,
      target_id: String,
      target_type : {
        type: String,
        enum: ["post", "lesson"],
        required: true,
      },
      created_at:{ type: Date, default: Date.now },
    },
  },
  {
    collection: "bookmarks",
  }
);

BookmarkSchema.index({ user_id: 1, post_id: 1 },{ unique: true });
 
const Bookmark =
  mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);
 
export default Bookmark;