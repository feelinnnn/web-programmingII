import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Badge from '@/models/Badge'
import EvidenceRequirement from '@/models/EvidenceRequirement'
import { isAdmin } from '@/lib/admin'

const templates: Record<string, { description: string; requirements: string[]; examples: string[] }> = {
  'expert-certified': {
    description: 'Upload clear evidence that proves your expertise in this area. This evidence will be reviewed by an expert certifier.',
    requirements: [
      'Evidence must clearly show your work or skill',
      'Files should be in image (JPG, PNG) or video (MP4) format',
      'Each file should be accompanied by a brief description',
      'Maximum 10 evidence items per submission',
    ],
    examples: [
      'Photos of dishes you have prepared',
      'Videos demonstrating your cooking technique',
      'Certificates from culinary schools or workshops',
    ],
  },
  'self-declared': {
    description: 'Provide evidence to support your self-declared badge claim.',
    requirements: [
      'At least one evidence file is required',
      'Describe what each evidence item demonstrates',
      'Evidence should clearly relate to the badge you are claiming',
    ],
    examples: [
      'A photo of the completed dish or project',
      'A short video showing your process',
      'A screenshot of a completed online course',
    ],
  },
  'evidence-backed': {
    description: 'Upload evidence demonstrating you completed the lesson requirements.',
    requirements: [
      'Upload proof of completing the lesson',
      'Images or videos showing your final output',
      'Each file should have a clear description',
    ],
    examples: [
      'Photo of your completed dish following the lesson recipe',
      'Video showing your cooking process step-by-step',
    ],
  },
  'lesson': {
    description: 'Submit evidence of completing this lesson to claim your badge.',
    requirements: [
      'Show proof that you completed the lesson',
      'Upload a photo or video of your result',
    ],
    examples: [
      'Photo of the finished dish',
      'Video of your cooking process',
    ],
  },
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect()
    const badges = await Badge.find().lean()
    let created = 0
    let skipped = 0

    for (const badge of badges) {
      const exists = await EvidenceRequirement.findOne({ badgeId: badge._id })
      if (exists) { skipped++; continue }

      const type = (badge as any).badge_type || 'lesson'
      const t = templates[type] || templates['lesson']
      await EvidenceRequirement.create({ badgeId: badge._id, ...t })
      created++
    }

    return NextResponse.json({ success: true, created, skipped, total: badges.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
