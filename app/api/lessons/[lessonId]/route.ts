import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Lesson, { ILesson } from '@/models/Lesson'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }  // ← type params as Promise
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

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: `/api/lessons/${lessonId}` },
    data: {
      id: lesson._id,
      type: "lesson",
      attributes: {
        title: lesson.title,
        description: lesson.description,
        thumbnail_url: lesson.thumbnail_url,
        badge: lesson.badge,
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