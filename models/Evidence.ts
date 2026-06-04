import mongoose, { Schema, Document } from 'mongoose'

export interface IEvidence {
  _id: string  // Same as badgeId (1-to-1 relationship)
  description: string
  examples: string[]
  requirements: string[]
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    _id: { type: String, required: true },  // Evidence ID = Badge ID (1-to-1)
    description: { type: String, required: true },
    examples: { type: [String], default: [] },
    requirements: { type: [String], default: [] }
  }
)

export default mongoose.models.Evidence || mongoose.model<IEvidence>('Evidence', EvidenceSchema)
