import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import UserBadge from '@/models/UserBadge'
import Badge from '@/models/Badge'
import Lesson from '@/models/Lesson'
import { getToken } from 'next-auth/jwt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || "COOKCULT_SECRET_KEY"
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "COOKCULT_SECRET_KEY"

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const session = await getToken({ req, secret: NEXTAUTH_SECRET })
    if (session?.id) return session.id as string
    if (session?.sub) return session.sub
  } catch {}

  const authHeader = req.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7)
      const decoded: any = jwt.verify(token, JWT_SECRET)
      return decoded.user_id || decoded.id || null
    } catch {}
  }

  return null
}

// GET /api/user-badges?userId=xxx — fetch badges for a user with badge details populated
export async function GET(req: NextRequest) {
  try {
    await connect()

    const url = new URL(req.url)
    let userId = url.searchParams.get("userId") || null

    if (!userId) {
      userId = await getUserId(req)
    }

    if (!userId) {
      return NextResponse.json(
        { errors: [{ status: "401", title: "Unauthorized", detail: "userId required" }] },
        { status: 401 }
      )
    }

    const userBadges = await UserBadge.find({ userId }).lean()

    const badgeIds = userBadges.map((ub: any) => ub.badgeId)
    const badges = badgeIds.length
      ? await Badge.find({ _id: { $in: badgeIds } }).lean()
      : []
    const badgeMap = new Map(badges.map((b: any) => [b._id.toString(), b]))

    const lessons = badgeIds.length
      ? await Lesson.find({ badge: { $in: badgeIds } }).lean()
      : []
    const lessonMap = new Map(lessons.map((l: any) => [l.badge, l]))

    const data = userBadges.map((ub: any) => {
      const badge = badgeMap.get(ub.badgeId?.toString()) as any
      const lesson = lessonMap.get(ub.badgeId)
      const badgeName = badge?.name || ub.userNote || "Badge"
      const badgeDesc = badge?.description || ub.userNote || ""
      const badgeType = badge?.badge_type || ub.badgeTypeSnapshot || "self-declared"

      return {
        id: ub._id,
        type: "user_badge",
        attributes: {
          userId: ub.userId,
          badgeId: ub.badgeId,
          status: ub.status,
          evidenceUrls: ub.evidenceUrls,
          userNote: ub.userNote,
          adminId: ub.adminId,
          adminComment: ub.adminComment,
          submittedAt: ub.submittedAt,
          verifiedAt: ub.verifiedAt,
          badgeTypeSnapshot: ub.badgeTypeSnapshot,
          showcased: ub.showcased || false,
          certificationRequested: ub.certificationRequested || false,
        },
        relationships: {
          badge: {
            data: {
              id: badge?._id || ub.badgeId,
              type: "badge",
              attributes: {
                name: badgeName,
                description: badgeDesc,
                badge_type: badgeType,
                icon_url: badge?.icon_url || null,
                thumbnail_url: lesson?.thumbnail_url || ub.evidenceUrls?.[0] || null,
              },
            },
          },
        },
      }
    })

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      links: { self: "/api/user-badges" },
      data,
    })
  } catch (error: any) {
    console.error("GET /api/user-badges error:", error)
    return NextResponse.json(
      { errors: [{ detail: error.message }] },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    await connect()
    const body = await req.json()
    const { userId, badgeId, badgeTypeSnapshot, userNote, evidenceUrls } = body.data.attributes

    const isLesson = badgeTypeSnapshot === "lesson"

    const userBadge = await UserBadge.create({
      userId,
      badgeId,
      status: isLesson ? "verified" : "non-request",
      evidenceUrls: evidenceUrls ?? [],
      userNote: userNote ?? null,
      adminId: null,
      adminComment: null,
      submittedAt: Date.now(),
      verifiedAt: isLesson ? Date.now() : null,
      badgeTypeSnapshot,
      showcased: false
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
    if (err.code === 11000) {
      return NextResponse.json(
        { errors: [{ detail: "You already have this badge. Each badge can only be earned once." }] },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}