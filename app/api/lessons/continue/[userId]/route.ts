import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Progress, { IProgress } from "@/models/Progress";
import Chapter, { IChapter} from '@/models/Chapter'



export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connect()
    const { userId } = await params

    // 1. find all progress for this user
    const progress = await Progress.find({ userID: userId })

    if (!progress || progress.length === 0) {
          console.log("called")
      return NextResponse.json(
        { errors: [{ status: "404", title: "Not Found", detail: "No progress found for this user" }] },
        { status: 404 }
      )
    }

    // 2. for each progress, find incomplete chapters
    const data = await Promise.all(
      progress.map(async (progress) => {
        const allChapters = await Chapter.find({ lessonId: progress.lessonId }).sort({ order: 1 })
        console.log(allChapters)
        const completedIds = progress.completedChapter.map((id: string) => id.toString())
        const incompleteChapters = allChapters.filter(
          (chapter) => !completedIds.includes(chapter._id.toString())
        )

        return {
          id: progress._id,
          type: "progress",
          attributes: {
            userID: progress.userID,
            lessonId: progress.lessonId,
            totalChapters: allChapters.length,
            completedCount: progress.completedChapter.length,
            remainingCount: incompleteChapters.length,
            badgeSubmitted: progress.badgeSubmitted ?? false,
          },
          relationships: {
            completedChapters: {
              data: progress.completedChapter.map((id: string) => ({ id, type: "chapter" }))
            },
            incompleteChapters: {
              data: incompleteChapters.map((chapter) => ({
                id: chapter._id,
                type: "chapter",
                attributes: {
                  title: chapter.title,
                  order: chapter.order,
                  videoUrl: chapter.videoUrl,
                  type: chapter.type,
                }
              }))
            }
          }
        }
      })
    )

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      links: { self: `/api/progress/${userId}` },
      data
    })

  } catch (err: any) {
    console.log(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}