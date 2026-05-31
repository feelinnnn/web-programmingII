import mongoose, { Schema, Document } from 'mongoose'

export interface ILesson{
  _id: string
  title: string
  description: string
  thumbnail_url: string
  chapters: string[]
  badge: string
  created_at: Date
}

const LessonSchema = new Schema<ILesson>({
  _id: { type: String },
  title: { type: String, required: true },
  description: { type: String },
  thumbnail_url: { type: String },
  chapters: { type: [String], default: [] },
  badge: { type: String },
  created_at: { type: Date, default: Date.now }
})

export default mongoose.models.Lesson || mongoose.model<ILesson>('Lesson', LessonSchema)