import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import UserBadge from '@/models/UserBadge'
import Lesson from '@/models/Lesson'
import Progress from '@/models/Progress'


export async function POST(req: NextRequest) {
  try {
    await connect()
    const body = await req.json()
    const { userId, badgeId, badgeTypeSnapshot, userNote, evidenceUrls } = body.data.attributes

    const isLesson = badgeTypeSnapshot === "lesson"

    const userBadge = await UserBadge.create({
      userId,
      badgeId,
      status: isLesson ? "verified" : "pending",
      evidenceUrls: evidenceUrls ?? [],
      userNote: userNote ?? null,
      adminId: null,
      adminComment: null,
      submittedAt: Date.now(),
      verifiedAt: isLesson ? Date.now() : null,
      badgeTypeSnapshot,
      showcased: false
    })

    // Update Progress.badgeSubmitted if badge type is "lesson" or "evidence-backed"
    if (badgeTypeSnapshot === "lesson" || badgeTypeSnapshot === "evidence-backed") {
      try {
        const lesson = await Lesson.findOne({ badge: badgeId })
        if (lesson) {
          const progress = await Progress.findOne({ userID: userId, lessonId: lesson._id })
          if (progress) {
            progress.badgeSubmitted = true
            await progress.save()
          }
        }
      } catch (updateErr) {
        console.error("Failed to update Progress.badgeSubmitted:", updateErr)
        // Don't fail badge creation if Progress update fails
      }
    }

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      data: {
        id: userBadge._id,
        type: "user-badge",
        attributes: {
          userId: userBadge.userId,
          badgeId: userBadge.badgeId,
          status: userBadge.status,
          evidenceUrls: userBadge.evidenceUrls,
          userNote: userBadge.userNote,
          adminComment: userBadge.adminComment,
          submittedAt: userBadge.submittedAt,
          verifiedAt: userBadge.verifiedAt,
          badgeTypeSnapshot: userBadge.badgeTypeSnapshot
        }
      }
    }, { status: 201 })

  } catch (err: any) {
    console.log(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}