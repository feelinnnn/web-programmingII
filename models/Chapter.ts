import mongoose, { Schema, Document } from 'mongoose'

export interface IChapter{
  _id: string
  title: string
  lessonId: string
  content: string
  videoUrl: string
  type: string
  order: number
}

const ChapterSchema = new Schema<IChapter>({
  _id: { type: String },
  title: { type: String, required: true },
  lessonId: { type: String },
  content: { type: String },
  videoUrl: { type: String },
  type: { type: String },
  order: { type: Number},
})

export default mongoose.models.Chapter || mongoose.model<IChapter>('Chapter', ChapterSchema)