import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Lesson, { ILesson } from '@/models/Lesson'

export async function GET(request: NextRequest) {
  await connect()
  const lessons: ILesson[] = await Lesson.find()

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: "/api/lessons" },
    data: lessons.map((lesson: ILesson) => ({
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
          links: { related: `/api/lessons/${lesson._id}/chapters` },
          data: (lesson.chapters ?? []).map((id: string) => ({ id, type: "chapter" }))
        }
      }
    }))
  })
}