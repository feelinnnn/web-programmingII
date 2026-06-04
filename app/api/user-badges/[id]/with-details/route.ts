import { NextRequest, NextResponse } from 'next/server'
import connect from '@/lib/mongodb'
import UserBadge from '@/models/UserBadge'
import Badge from '@/models/Badge'
import Lesson from '@/models/Lesson'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connect()
    const { id } = await params

    const userBadges = await UserBadge.find({ id }).lean()

    if (!userBadges || userBadges.length === 0) {
      return NextResponse.json({
        jsonapi: { version: "1.0" },
        links: { self: `/api/user-badges/${id}/with-details` },
        data: []
      })
    }

    // Fetch all badges and lessons
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
          badge: {
            id: badge?._id || ub.badgeId,
            name: badgeName,
            description: badgeDesc,
            badge_type: badgeType,
            icon_url: badge?.icon_url || null
          },
          lesson: lesson ? {
            id: lesson._id,
            title: lesson.title,
            description: lesson.description,
            thumbnail_url: lesson.thumbnail_url,
            created_at: lesson.created_at
          } : null
        },
        relationships: {
          badge: {
            data: {
              id: badge?._id || ub.badgeId,
              type: "badge"
            }
          },
          ...(lesson && {
            lesson: {
              data: {
                id: lesson._id,
                type: "lesson"
              }
            }
          })
        }
      }
    })

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      links: { self: `/api/user-badges/${id}/with-details` },
      data
    })

  } catch (error: any) {
    console.error(`GET /api/user-badges/id/with-details error:`, error)
    return NextResponse.json(
      { errors: [{ detail: error.message }] },
      { status: 500 }
    )
  }
}
