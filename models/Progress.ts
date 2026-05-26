import mongoose from "mongoose";

const ProgresssSchema = new mongoose.Schema(
  {
    progress: {
      userId : String,
      lessonId:String,
      completedChapters : [String],
      lastAccessed : String
    },
  },
  {
    collection: "progress",
  }
);

const Progress =
  mongoose.models.Progress ||
  mongoose.model("Progress", ProgresssSchema);

export default Progress;