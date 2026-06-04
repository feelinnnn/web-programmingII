import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Lesson, { ILesson } from '@/models/Lesson'
import Badge, { IBadge } from '@/models/Badge'

export async function GET(request: NextRequest) {
  await connect()

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '15', 10)))
  const skip = (page - 1) * limit

  const [lessons, total] = await Promise.all([
    Lesson.find().skip(skip).limit(limit),
    Lesson.countDocuments(),
  ])

  const badgeIds = [...new Set(lessons.map((l: ILesson) => l.badge).filter(Boolean))]
  const badges: IBadge[] = badgeIds.length > 0
    ? await Badge.find({ _id: { $in: badgeIds } })
    : []
  const badgeMap = new Map(badges.map(b => [b._id, b]))

  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: {
      self: `/api/lessons/with-badges?page=${page}&limit=${limit}`,
      first: `/api/lessons/with-badges?page=1&limit=${limit}`,
      last: `/api/lessons/with-badges?page=${totalPages}&limit=${limit}`,
    },
    meta: { total, page, limit, totalPages },
    data: lessons.map((lesson: ILesson) => {
      const badge = lesson.badge ? badgeMap.get(lesson.badge) : null
      return {
        id: lesson._id,
        type: "lesson",
        attributes: {
          title: lesson.title,
          description: lesson.description,
          thumbnail_url: lesson.thumbnail_url,
          badge: badge ? {
            id: badge._id,
            name: badge.name,
            description: badge.description,
            badge_type: badge.badge_type,
            icon_url: badge.icon_url
          } : null,
          created_at: lesson.created_at
        },
        relationships: {
          chapters: {
            links: { related: `/api/lessons/${lesson._id}/chapters` },
            data: (lesson.chapters ?? []).map((id: string) => ({ id, type: "chapter" }))
          }
        }
      }
    })
  })
}
