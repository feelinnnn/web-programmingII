import mongoose, { Schema, Document } from 'mongoose'

export interface IUserBadge extends Document {
  userId: string
  badgeId: string
  status: 'pending' | 'verified' | 'declined'
  evidenceUrls: string[]
  userNote: string
  adminId: string | null
  adminComment: string | null
  submittedAt: Date
  verifiedAt: Date | null
  badgeTypeSnapshot: "self-declared" | "evidence-backed" | "expert-certified" | "lesson"
  showcased: boolean
}

const UserBadgeSchema = new Schema<IUserBadge>({
  userId: { type: String, required: true },
  badgeId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'declined'], 
    default: 'pending' 
  },
  evidenceUrls: [String],
  userNote: { type: String },
  adminId: { type: String, default: null },
  adminComment: { type: String, default: null },
  submittedAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date, default: null },
  badgeTypeSnapshot: {
    type: String,
    enum: ["self-declared", "evidence-backed", "expert-certified", "lesson"]
  },
  showcased: { type: Boolean, default: false }
})

export default mongoose.models.UserBadge || mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema)