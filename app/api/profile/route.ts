import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import UserStats from "@/models/User_stat";
import UserBadge from "@/models/UserBadge";
import Badge from "@/models/Badge";
import Post from "@/models/Post";
import Lesson from "@/models/Lesson";
import Progress from "@/models/Progress";
import Follow from "@/models/Follow";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";

async function getUserId(req: NextRequest): Promise<string | null> {
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

  try {
    const session = await getToken({ req, secret: NEXTAUTH_SECRET });
    if (session?.id) return session.id as string;
    if (session?.sub) return session.sub;
  } catch {

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

    // Force admin status for the specific admin email
    if (user.email === "admin@cookcult.com") {
      user.role = "admin";
      user.sub_namebio = "System Admin";
    }

    const authUserId = user.user_id || user._id.toString();

    const [userBadges, progressDocs, followerCount, followingCount, postCount] = await Promise.all([
      UserBadge.find({ userId: authUserId }).lean(),
      Progress.find({ userID: authUserId }).lean(),
      Follow.countDocuments({ "comment.following_user_id": authUserId }),
      Follow.countDocuments({ "comment.follower_user_id": authUserId }),
      Post.countDocuments({ "post.user_id": authUserId }),
    ]);

    // Compute stats dynamically from real badge data
    const statsData = {
      total_badges_verified: userBadges.filter((b: any) => b.status === "verified").length,
      total_self_declared_count: userBadges.filter((b: any) => b.badgeTypeSnapshot === "self-declared").length,
      total_evidence_backed_count: userBadges.filter((b: any) => b.badgeTypeSnapshot === "evidence-backed").length,
      total_expert_certified_count: userBadges.filter((b: any) => b.badgeTypeSnapshot === "expert-certified").length,
      total_lesson_badge_count: userBadges.filter((b: any) => b.badgeTypeSnapshot === "lesson" || b.badgeTypeSnapshot === "evidence-backed").length,
    };

    // Resolve badge details for each user_badge
    const badgeIds = userBadges.map((ub: any) => ub.badgeId);
    const badges = badgeIds.length
      ? await Badge.find({ _id: { $in: badgeIds } }).lean()
      : [];
    const badgeMap = new Map(badges.map((b: any) => [b._id.toString(), b]));

    // Find lessons that match these badge IDs (for thumbnail)
    const lessons = badgeIds.length
      ? await Lesson.find({ badge: { $in: badgeIds } }).lean()
      : [];
    const lessonMap = new Map(lessons.map((l: any) => [l.badge, l]));

    const badgesData = userBadges.map((ub: any) => {
      const badge = badgeMap.get(ub.badgeId?.toString()) as any;
      const lesson = lessonMap.get(ub.badgeId);
      // Fallback for self-declared badges (no matching Badge doc)
      const badgeName = badge?.name || ub.userNote || "Self Declared";
      const badgeDesc = badge?.description || ub.userNote || "";
      const badgeType = badge?.badge_type || ub.badgeTypeSnapshot || "self-declared";
      return {
        id: ub._id,
        type: "user_badge",
        attributes: {
          status: ub.status,
          evidence_urls: ub.evidenceUrls,
          user_note: ub.userNote,
          admin_comment: ub.adminComment,
          badge_type_snapshot: ub.badgeTypeSnapshot,
          showcased: ub.showcased || false,
          certification_requested: ub.certificationRequested || false,
          submitted_at: ub.submittedAt,
          verified_at: ub.verifiedAt,
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
      };
    });

    const statsAttributes = statsData;

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
          follower_count: followerCount,
          following_count: followingCount,
          post_count: postCount,
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