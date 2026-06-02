import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Badge, { IBadge } from '@/models/Badge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ _id: string }> }
) {
  await connect()
  const { _id } = await params

  const badge: IBadge | null = await Badge.findOne({ _id })

  if (!badge) {
    return NextResponse.json(
      { errors: [{ status: "404", title: "Not Found", detail: `Badge ${_id} not found` }] },
      { status: 404 }
    )
  }

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: `/api/badges/${_id}` },
    data: {
      id: badge._id,
      type: "badge",
      attributes: {
        name: badge.name,
        description: badge.description,
        badge_type: badge.badge_type,
        icon_url: badge.icon_url,
      }
    }
  })
}