import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Lesson, { ILesson } from '@/models/Lesson'
import Badge, { IBadge } from '@/models/Badge'

export async function GET(request: NextRequest) {
  await connect()

  const lessons: ILesson[] = await Lesson.find()
  const badges: IBadge[] = await Badge.find()

  // Create a map of badges by ID for quick lookup
  const badgeMap = new Map(badges.map(b => [b._id, b]))

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: "/api/lessons/with-badges" },
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
