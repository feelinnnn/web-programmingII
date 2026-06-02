import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import UserStats from "@/models/User_stat";
import UserBadge from "@/models/UserBadge";
import Badge from "@/models/Badge";
import Lesson from "@/models/Lesson";
import Follow from "@/models/Follow";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connect();

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json(
        { errors: [{ detail: "User not found" }] },
        { status: 404 }
      );
    }

    const authUserId = user.user_id || user._id.toString();

    const [stats, userBadges, followerCount, followingCount] = await Promise.all([
      UserStats.findOne({ "user_stats.user_id": authUserId }).lean(),
      UserBadge.find({ userId: authUserId }).lean(),
      Follow.countDocuments({ "comment.following_user_id": authUserId }),
      Follow.countDocuments({ "comment.follower_user_id": authUserId }),
    ]);

    const badgeIds = userBadges.map((ub: any) => ub.badgeId);
    const badges = badgeIds.length
      ? await Badge.find({ _id: { $in: badgeIds } }).lean()
      : [];
    const badgeMap = new Map(badges.map((b: any) => [b._id.toString(), b]));

    // Find lessons for thumbnail
    const lessons = badgeIds.length
      ? await Lesson.find({ badge: { $in: badgeIds } }).lean()
      : [];
    const lessonMap = new Map(lessons.map((l: any) => [l.badge, l]));

    const badgesData = userBadges.map((ub: any) => {
      const badge = badgeMap.get(ub.badgeId?.toString()) as any;
      const lesson = lessonMap.get(ub.badgeId);
      const badgeName = badge?.name || ub.userNote || "Self Declared";
      const badgeType = badge?.badge_type || ub.badgeTypeSnapshot || "self-declared";
      return {
        id: ub._id,
        attributes: {
          status: ub.status,
          badge_type_snapshot: ub.badgeTypeSnapshot,
          showcased: ub.showcased || false,
          user_note: ub.userNote || "",
          evidence_urls: ub.evidenceUrls || [],
        },
        relationships: {
          badge: {
            data: {
              id: badge?._id || ub.badgeId,
              attributes: {
                name: badgeName,
                description: badge?.description || ub.userNote || "",
                badge_type: badgeType,
                icon_url: badge?.icon_url || null,
                thumbnail_url: lesson?.thumbnail_url || ub.evidenceUrls?.[0] || null,
              },
            },
          },
        },
      };
    });

    return NextResponse.json({
      data: {
        id: user._id,
        attributes: {
          email: user.email,
          display_name: user.display_name,
          sub_namebio: user.sub_namebio || "",
          bio: user.bio,
          profile_image_url: user.profile_image_url,
          social_links: user.social_links,
          role: user.role,
          follower_count: followerCount,
          following_count: followingCount,
        },
        relationships: {
          stats: stats?.user_stats ? { data: stats.user_stats } : { data: null },
          badges: { data: badgesData },
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ detail: error.message }] },
      { status: 500 }
    );
  }
}
