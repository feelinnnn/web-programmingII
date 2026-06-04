import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Progress, { IProgress } from "@/models/Progress";
import Chapter, { IChapter } from '@/models/Chapter'
import Lesson, { ILesson } from '@/models/Lesson'
import Badge, { IBadge } from '@/models/Badge'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connect()
    const { userId } = await params

    // 1. Find all progress for this user
    const progress = await Progress.find({ userID: userId })

    if (!progress || progress.length === 0) {
      return NextResponse.json(
        { errors: [{ status: "404", title: "Not Found", detail: "No progress found for this user" }] },
        { status: 404 }
      )
    }

    // 2. Fetch all lessons and badges
    const lessonIds = progress.map(p => p.lessonId)
    const lessons = await Lesson.find({ _id: { $in: lessonIds } })
    const badgeIds = lessons.map(l => l.badge).filter((id): id is string => !!id)
    const badges = await Badge.find({ _id: { $in: badgeIds } })

    // Create maps for quick lookup
    const lessonMap = new Map(lessons.map(l => [l._id, l]))
    const badgeMap = new Map(badges.map(b => [b._id, b]))

    // 3. For each progress, find incomplete chapters and populate badge
    const data = await Promise.all(
      progress.map(async (progressItem) => {
        const allChapters = await Chapter.find({ lessonId: progressItem.lessonId }).sort({ order: 1 })
        const completedIds = progressItem.completedChapter.map((id: string) => id.toString())
        const incompleteChapters = allChapters.filter(
          (chapter) => !completedIds.includes(chapter._id.toString())
        )

        // Get the lesson and badge for this progress
        const lesson = lessonMap.get(progressItem.lessonId)
        const badge = lesson && lesson.badge ? badgeMap.get(lesson.badge) : null

        return {
          id: progressItem._id,
          type: "progress",
          attributes: {
            userID: progressItem.userID,
            lessonId: progressItem.lessonId,
            totalChapters: allChapters.length,
            completedCount: progressItem.completedChapter.length,
            remainingCount: incompleteChapters.length,
            badgeSubmitted: progressItem.badgeSubmitted ?? false,
            lesson: lesson ? {
              id: lesson._id,
              title: lesson.title,
              description: lesson.description,
              thumbnail_url: lesson.thumbnail_url,
              created_at: lesson.created_at
            } : null,
            badge: badge ? {
              id: badge._id,
              name: badge.name,
              description: badge.description,
              badge_type: badge.badge_type,
              icon_url: badge.icon_url
            } : null
          },
          relationships: {
            completedChapters: {
              data: progressItem.completedChapter.map((id: string) => ({ id, type: "chapter" }))
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
      links: { self: `/api/lessons/continue/${userId}/with-badges` },
      data
    })

  } catch (err: any) {
    console.log(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
