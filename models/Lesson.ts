import mongoose from "mongoose";
import { title } from "process";
 
const LessonSchema = new mongoose.Schema(
  {
    lesson: {
      lesson_id:    String,
      title:        String,
      description: String,
      chapters: [String],
      Badge : String
    },
  },
  {
    collection: "lessons",
  }
);
 
const Lesson =
  mongoose.models.Lesson || mongoose.model("Lesson", LessonSchema);
 
export default Lesson;