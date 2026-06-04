import mongoose, { Schema, Document } from 'mongoose'

export interface IEvidenceRequirement extends Document {
  badgeId: string
  description: string
  requirements: string[]
  examples: string[]
}

const EvidenceRequirementSchema = new Schema<IEvidenceRequirement>({
  badgeId: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  requirements: { type: [String], default: [] },
  examples: { type: [String], default: [] },
})

export default mongoose.models.EvidenceRequirement
  || mongoose.model<IEvidenceRequirement>('EvidenceRequirement', EvidenceRequirementSchema)
