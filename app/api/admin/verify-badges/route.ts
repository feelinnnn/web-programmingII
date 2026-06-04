import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connect from "@/lib/mongodb";
import UserBadge from "@/models/UserBadge";
import Badge from "@/models/Badge";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";

async function isAdmin(req: NextRequest): Promise<{userId: string, email: string} | null> {
  let decoded: any = null;

  // 1. Check Bearer Token first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {}
  }

  // 2. Check NextAuth Session
  if (!decoded) {
    try {
      decoded = await getToken({ req, secret: NEXTAUTH_SECRET });
    } catch {}
  }

  if (!decoded) return null;

  const email = decoded.email;
  const userId = decoded.id || decoded.user_id || decoded.sub;

  // Instant bypass for hardcoded admin email
  if (email === "admin@cookcult.com") return { userId, email };

  await connect();
  const user = await User.findOne({ 
    $or: [{ user_id: userId }, { email: email }, { _id: userId.length === 24 ? userId : null }] 
  }, { role: 1, user_id: 1, email: 1 }).lean();

  if (user?.role === "admin") return { userId: user.user_id || user._id.toString(), email: user.email };
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();

    // Fetch pending requests - broadened filter to ensure nothing is missed
    const pendingBadges = await UserBadge.find({
      status: "pending"
    })
    .sort({ submittedAt: 1 })
    .select('userId badgeId status evidenceUrls userNote badgeTypeSnapshot submittedAt showcased certificationRequested')
    .limit(100)
    .lean();

    if (!pendingBadges || pendingBadges.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const userIds = Array.from(new Set(pendingBadges.map(b => b.userId)));
    const badgeIds = Array.from(new Set(pendingBadges.map(b => b.badgeId)));

    // Optimize: Fetch only necessary fields
    const [users, badgeDefs] = await Promise.all([
      User.find(
        { 
          $or: [
            { user_id: { $in: userIds } }, 
            { email: { $in: userIds } },
            { _id: { $in: userIds.filter(id => id.length === 24) } }
          ] 
        },
        { display_name: 1, profile_image_url: 1, email: 1, user_id: 1 }
      ).lean(),
      Badge.find(
        { _id: { $in: badgeIds } },
        { name: 1, description: 1, icon_url: 1, badge_type: 1 }
      ).lean()
    ]);

    const userMap = new Map();
    users.forEach(u => {
      if (u.user_id) userMap.set(u.user_id, u);
      if (u.email) userMap.set(u.email, u);
      userMap.set(u._id.toString(), u);
    });
    
    const badgeMap = new Map(badgeDefs.map(b => [b._id.toString(), b]));

    const result = pendingBadges.map(ub => ({
      ...ub,
      user: userMap.get(ub.userId) || null,
      badge: badgeMap.get(ub.badgeId) ? {
        ...badgeMap.get(ub.badgeId),
        thumbnail_url: ub.evidenceUrls?.[0] || badgeMap.get(ub.badgeId).icon_url || null
      } : null
    }));

    return NextResponse.json({ 
      data: result,
      meta: {
        totalPending: pendingBadges.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Management Hub GET Critical Error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userBadgeId, status, adminComment } = await req.json();

    if (!['verified', 'declined'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await connect();
    const updated = await UserBadge.findByIdAndUpdate(
      userBadgeId,
      {
        status,
        adminComment,
        adminId: admin.userId, // Extract string ID from object
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "User badge not found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("Management Hub POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
