import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import Chapter, { IChapter} from '@/models/Chapter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }  // ← type params as Promise
) {
  await connect()
  const { lessonId } = await params
  const chapters = await Chapter.find({ lessonId: lessonId })
  


  if (!chapters) {
    console.log("fall in this error")
    return NextResponse.json(
      { errors: [{ status: "404", title: "Not Found", detail: `Lesson ${lessonId} not found` }] },
      { status: 404 }
    )
  }

  return NextResponse.json({
    jsonapi: { version: "1.0" },
    links: { self: `/api/${lessonId}/chapters` },
    data: chapters.map((chapter: IChapter) => ({
      id: chapter._id,
      type: "chapter",
      attributes: {
        title: chapter.title,
        content: chapter.content,
        videoUrl: chapter.videoUrl,
        type: chapter.type,
        order: chapter.order
      },
      relationships: {
        lesson: {
          links: { related: `/api/lessons/${chapter.lessonId}` },
          data: {id : chapter.lessonId , type:"lesson"}
        }
      }
    }))
  })
}