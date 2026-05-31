import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Badge, {IBadge}  from '@/models/Badge'

export async function GET(request: NextRequest) {
  await connect()
  const badges: IBadge[] = await Badge.find()

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: "/api/badges" },
    data: badges.map((badge: IBadge) => ({
      id: badge._id,
      type: "badge",
      attributes: {
        name: badge.name,
        description: badge.description,
        badge_type: badge.badge_type,
        icon_url: badge.badge_type,
      }
    //,
    //   relationships: {
    //     lesson: {
    //       links: { related: `/api/lessons/${lesson._id}` },
    //       data: (lesson.chapters ?? []).map((id: string) => ({ id, type: "chapter" }))
    //     }
    //   }
    }))
  })
}