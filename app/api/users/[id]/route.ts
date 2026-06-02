import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import UserStats from "@/models/User_stat";
import UserBadge from "@/models/UserBadge";
import Badge from "@/models/Badge";

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

    const [stats, userBadges] = await Promise.all([
      UserStats.findOne({ "user_stats.user_id": authUserId }).lean(),
      UserBadge.find({ userId: authUserId }).lean(),
    ]);

    const badgeIds = userBadges.map((ub: any) => ub.badgeId);
    const badges = badgeIds.length
      ? await Badge.find({ _id: { $in: badgeIds } }).lean()
      : [];
    const badgeMap = new Map(badges.map((b: any) => [b._id.toString(), b]));

    const badgesData = userBadges.map((ub: any) => {
      const badge = badgeMap.get(ub.badgeId?.toString()) as any;
      return {
        id: ub._id,
        attributes: {
          status: ub.status,
          badge_type_snapshot: ub.badgeTypeSnapshot,
        },
        relationships: {
          badge: badge
            ? {
                data: {
                  id: badge._id,
                  attributes: {
                    name: badge.name,
                    badge_type: badge.badge_type,
                    icon_url: badge.icon_url,
                  },
                },
              }
            : { data: null },
        },
      };
    });

    return NextResponse.json({
      data: {
        id: user._id,
        attributes: {
          display_name: user.display_name,
          sub_namebio: user.sub_namebio || "",
          bio: user.bio,
          profile_image_url: user.profile_image_url,
          social_links: user.social_links,
          role: user.role,
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
