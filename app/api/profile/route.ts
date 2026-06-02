import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import UserStats from "@/models/User_stat";
import UserBadge from "@/models/UserBadge"; 
import Badge from "@/models/Badge";
import Progress from "@/models/Progress";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";

async function getUserId(req: NextRequest): Promise<string | null> {

  try {
    const session = await getToken({ req, secret: NEXTAUTH_SECRET });
    if (session?.id) return session.id as string;
    if (session?.sub) return session.sub;
  } catch {

  }

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded: any = jwt.verify(token, JWT_SECRET);
      return decoded.id || null;
    } catch {
      // Token invalid or expired
    }
  }

  return null;
}

// GET /api/profile 
export async function GET(req: NextRequest) {
  try {
    await connect();

    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { errors: [{ status: "401", title: "Unauthorized", detail: "Authentication required" }] },
        { status: 401 }
      );
    }

    const user = await User.findOne({ user_id: userId }).lean()
      || await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json(
        { errors: [{ status: "404", title: "Not Found", detail: "User not found" }] },
        { status: 404 }
      );
    }

    const authUserId = user.user_id || user._id.toString();

    const [stats, userBadges, progressDocs] = await Promise.all([
      UserStats.findOne({ "user_stats.user_id": authUserId }).lean(),
      UserBadge.find({ userId: authUserId }).lean(),
      Progress.find({ userID: authUserId }).lean(),
    ]);

    // Resolve badge details for each user_badge
    const badgeIds = userBadges.map((ub: any) => ub.badgeId);
    const badges = badgeIds.length
      ? await Badge.find({ _id: { $in: badgeIds } }).lean()
      : [];
    const badgeMap = new Map(badges.map((b: any) => [b._id.toString(), b]));

    const badgesData = userBadges.map((ub: any) => {
      const badge = badgeMap.get(ub.badgeId?.toString()) as any;
      return {
        id: ub._id,
        type: "user_badge",
        attributes: {
          status: ub.status,
          evidence_urls: ub.evidenceUrls,
          user_note: ub.userNote,
          badge_type_snapshot: ub.badgeTypeSnapshot,
          submitted_at: ub.submittedAt,
          verified_at: ub.verifiedAt,
        },
        relationships: {
          badge: badge
            ? {
                data: {
                  id: badge._id,
                  type: "badge",
                  attributes: {
                    name: badge.name,
                    description: badge.description,
                    badge_type: badge.badge_type,
                    icon_url: badge.icon_url,
                  },
                },
              }
            : { data: null },
        },
      };
    });

    const statsAttributes = stats?.user_stats
      ? {
          total_badges_verified: stats.user_stats.total_badges_verified,
          total_self_declared_count: stats.user_stats.total_self_declared_count,
          total_evidence_backed_count: stats.user_stats.total_evidence_backed_count,
          total_expert_certified_count: stats.user_stats.total_expert_certified_count,
          total_lesson_badge_count: stats.user_stats.total_lesson_badge_count,
        }
      : null;

    const progressSummary = {
      lessons_started: progressDocs.length,
      total_completed_chapters: progressDocs.reduce(
        (sum: number, p: any) => sum + (p.completedChapter?.length || 0),
        0
      ),
    };

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      links: { self: "/api/profile" },
      data: {
        id: user._id,
        type: "user",
        attributes: {
          user_id: user.user_id,
          email: user.email,
          authProvider: user.authProvider,
          display_name: user.display_name,
          role: user.role,
          sub_namebio: user.sub_namebio || "",
          profile_image_url: user.profile_image_url,
          bio: user.bio,
          social_links: user.social_links,
          created_at: user.created_at,
        },
        relationships: {
          stats: statsAttributes ? { data: statsAttributes } : { data: null },
          badges: { data: badgesData },
          progress: { data: progressSummary },
        },
      },
    });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { errors: [{ status: "500", title: "Internal Server Error", detail: error.message }] },
      { status: 500 }
    );
  }
}

// PATCH /api/profile — update the authenticated user's profile fields
export async function PATCH(req: NextRequest) {
  try {
    await connect();

    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { errors: [{ status: "401", title: "Unauthorized", detail: "Authentication required" }] },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Only allow updating these safe fields
    const allowedFields = ["display_name", "sub_namebio", "bio", "profile_image_url", "social_links"];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { errors: [{ status: "400", title: "Bad Request", detail: "No valid fields to update" }] },
        { status: 400 }
      );
    }

    let updatedUser = await User.findOneAndUpdate({ user_id: userId }, { $set: updates }, { new: true, runValidators: true }).lean();
    if (!updatedUser) {
      updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).lean();
    }

    if (!updatedUser) {
      return NextResponse.json(
        { errors: [{ status: "404", title: "Not Found", detail: "User not found" }] },
        { status: 404 }
      );
    }

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      links: { self: "/api/profile" },
      data: {
        id: updatedUser._id,
        type: "user",
        attributes: {
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          authProvider: updatedUser.authProvider,
          display_name: updatedUser.display_name,
          role: updatedUser.role,
          sub_namebio: updatedUser.sub_namebio || "",
          profile_image_url: updatedUser.profile_image_url,
          bio: updatedUser.bio,
          social_links: updatedUser.social_links,
          created_at: updatedUser.created_at,
        },
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/profile error:", error);
    return NextResponse.json(
      { errors: [{ status: "500", title: "Internal Server Error", detail: error.message }] },
      { status: 500 }
    );
  }
}