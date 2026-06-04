import mongoose, { Schema, Document } from 'mongoose'

export interface IUserBadge extends Document {
  userId: string
  badgeId: string
  status: 'non-request' | 'pending' | 'verified' | 'declined'
  evidenceUrls: string[]
  userNote: string
  adminId: string | null
  adminComment: string | null
  submittedAt: Date
  verifiedAt: Date | null
  badgeTypeSnapshot: "self-declared" | "evidence-backed" | "expert-certified" | "lesson"
  showcased: boolean
  certificationRequested: boolean
}

const UserBadgeSchema = new Schema<IUserBadge>({
  userId: { type: String, required: true },
  badgeId: { type: String, required: true },
  status: {
    type: String,
    enum: ['non-request', 'pending', 'verified', 'declined'],
    default: 'non-request'
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
  showcased: { type: Boolean, default: false },
  certificationRequested: { type: Boolean, default: false }
})

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true })
UserBadgeSchema.index({ status: 1 })
UserBadgeSchema.index({ badgeTypeSnapshot: 1 })
UserBadgeSchema.index({ submittedAt: -1 })

export default mongoose.models.UserBadge || mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema)