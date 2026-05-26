import mongoose from "mongoose";
 
const ChapterSchema = new mongoose.Schema(
  {
    chapter: {
      lesson_ID:    String,
      title:        String,
      content: String,
      videoUrl: String,
      type : {
        type:String,
        enum: ["video", "blog"],
        required: true,
      },
      order : Number
    },
  },
  {
    collection: "chapters",
  }
);
 
const Chapter =
  mongoose.models.Badge || mongoose.model("Badge", ChapterSchema);
 
export default Chapter;