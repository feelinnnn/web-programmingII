import mongoose, { Schema, Document } from 'mongoose'

export interface IProgress extends Document{
  userID : String
  lessonId : String
  completedChapter: [String]
  badgeSubmitted: Boolean
}

const ProgressSchema = new Schema<IProgress>({
  userID : {type: String},
  lessonId : {type: String},
  completedChapter: [String],
  badgeSubmitted: {type: Boolean, default: false},
})

ProgressSchema.index({ userID: 1, lessonId: 1 }, { unique: true })

export default mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema)