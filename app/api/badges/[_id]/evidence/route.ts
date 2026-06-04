import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import EvidenceRequirement from '@/models/EvidenceRequirement'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    await connect()
    const doc = await EvidenceRequirement.findOne({ badgeId: id }).lean()

    if (!doc) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({
      data: {
        id: doc._id,
        type: 'evidence-requirement',
        attributes: {
          description: doc.description || '',
          requirements: doc.requirements || [],
          examples: doc.examples || [],
        },
      },
    })
  } catch (err: any) {
    return NextResponse.json({ errors: [{ detail: err.message }] }, { status: 500 })
  }
}
