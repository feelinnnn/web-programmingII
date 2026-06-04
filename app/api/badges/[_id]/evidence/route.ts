import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Evidence, { IEvidence } from '@/models/Evidence'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  try {
    await connect()
    const { _id } = await params

    // 1-to-1 relationship: Evidence ID = Badge ID
    const evidence: IEvidence | null = await Evidence.findById(_id)

    if (!evidence) {
      return NextResponse.json({
        jsonapi: { version: "1.0" },
        links: { self: `/api/badges/${_id}/evidence` },
        data: null
      })
    }

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      links: { self: `/api/badges/${_id}/evidence` },
      data: {
        id: evidence._id,
        type: "evidence",
        attributes: {
          description: evidence.description,
          examples: evidence.examples,
          requirements: evidence.requirements
        }
      }
    })
  } catch (error: any) {
    console.error(`GET /api/badges/[badgeId]/evidence error:`, error)
    return NextResponse.json(
      { errors: [{ detail: error.message }] },
      { status: 500 }
    )
  }
}
