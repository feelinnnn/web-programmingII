import mongoose, { Schema, Document } from 'mongoose'

export interface IBadge {
  _id : string
  name: string
  description: string
  badge_type: "self-declared" | "evidence-backed" | "expert-certified" | "lesson"
  icon_url: string
}

const BadgeSchema = new Schema<IBadge>(
  {

    _id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    badge_type: {
      type: String,
      enum: ["self-declared", "evidence-backed", "expert-certified", "lesson"],
      required: true,
    },
    icon_url: {
      type: String,
      required: true,
    },
  }
)

export default mongoose.models.Badge || mongoose.model<IBadge>('Badge', BadgeSchema)