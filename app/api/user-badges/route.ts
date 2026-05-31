import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import UserBadge from '@/models/UserBadge'


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
      badgeTypeSnapshot
    })

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