import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Lesson, { ILesson } from '@/models/Lesson'
import Badge, { IBadge } from '@/models/Badge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  await connect()
  const { lessonId } = await params

  const lesson: ILesson | null = await Lesson.findById(lessonId)

  if (!lesson) {
    return NextResponse.json(
      { errors: [{ status: "404", title: "Not Found", detail: `Lesson ${lessonId} not found` }] },
      { status: 404 }
    )
  }

  // Fetch badge if the lesson has one
  let badgeData: IBadge | null = null
  if (lesson.badge) {
    badgeData = await Badge.findById(lesson.badge)
  }

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: `/api/lessons/${lessonId}/with-badge` },
    data: {
      id: lesson._id,
      type: "lesson",
      attributes: {
        title: lesson.title,
        description: lesson.description,
        thumbnail_url: lesson.thumbnail_url,
        badge: badgeData ? {
          id: badgeData._id,
          name: badgeData.name,
          description: badgeData.description,
          badge_type: badgeData.badge_type,
          icon_url: badgeData.icon_url
        } : null,
        created_at: lesson.created_at
      },
      relationships: {
        chapters: {
          links: { related: `/api/lessons/${lessonId}/chapters` },
          data: (lesson.chapters ?? []).map((id: string) => ({ id, type: "chapter" }))
        }
      }
    }
  })
}
