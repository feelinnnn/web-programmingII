import mongoose from "mongoose";
 
const BookmarkSchema = new mongoose.Schema(
  {
    bookmark: {
      bookmark_id:    String,
      user_id:        String,
      target_id:      String,
      post_id:        String,
      target_type : {
        type: String,
        enum: ["post", "lesson"],
        required: true,
      },
      created_at: { type: Date, default: Date.now },
    },
  },
  {
    collection: "bookmarks",
  }
);

// 👈 แก้ไขตรงนี้: เติม bookmark. นำหน้าฟิลด์ เพื่อให้ทำ Unique Index ข้างในวัตถุได้ถูกต้อง
BookmarkSchema.index({ "bookmark.user_id": 1, "bookmark.post_id": 1 }, { unique: true });
 
const Bookmark =
  mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);
 
export default Bookmark;