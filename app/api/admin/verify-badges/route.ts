import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import UserBadge from "@/models/UserBadge";
import Badge from "@/models/Badge";
import User from "@/models/User";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      console.log("Admin check failed for verify-badges");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conn = await connect();
    console.log("Connected to DB:", conn.connection.name);
    
    // Check collection existence
    const collections = await conn.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Fetch requests: Anything with evidence that isn't verified yet
    // This catches 'pending', 'declined', and even 'non-request' if it has evidence.
    const pendingBadges = await UserBadge.find({
      $and: [
        { status: { $ne: "verified" } },
        { evidenceUrls: { $exists: true, $not: { $size: 0 } } }
      ]
    })
    .sort({ submittedAt: -1 }) // Show newest first
    .lean();

    console.log(`Found ${pendingBadges.length} total reviewable badges in collection ${UserBadge.collection.name}`);

    if (!pendingBadges || pendingBadges.length === 0) {
      console.log("No pending badges found in DB");
      return NextResponse.json({ data: [] });
    }

    const userIds = Array.from(new Set(pendingBadges.map(b => b.userId)));
    const badgeIds = Array.from(new Set(pendingBadges.map(b => b.badgeId)));

    console.log("User IDs to fetch:", userIds);
    console.log("Badge IDs to fetch:", badgeIds);

    const [users, badgeDefs] = await Promise.all([
      User.find(
        { 
          $or: [
            { user_id: { $in: userIds } }, 
            { email: { $in: userIds } },
            { _id: { $in: userIds.filter(id => id && id.length === 24) } }
          ] 
        },
        { display_name: 1, profile_image_url: 1, email: 1, user_id: 1 }
      ).lean(),
      Badge.find(
        { _id: { $in: badgeIds } },
        { name: 1, description: 1, icon_url: 1, badge_type: 1 }
      ).lean()
    ]);

    console.log(`Found ${users.length} users and ${badgeDefs.length} badges`);

    const userMap = new Map();
    users.forEach(u => {
      const doc: any = u;
      if (doc.user_id) userMap.set(doc.user_id, doc);
      if (doc.email) userMap.set(doc.email, doc);
      userMap.set(doc._id.toString(), doc);
    });
    
    const badgeMap = new Map(badgeDefs.map(b => [b._id.toString(), b]));

    const result = pendingBadges.map(ub => {
      const badgeData: any = badgeMap.get(ub.badgeId);
      const userData = userMap.get(ub.userId) || null;

      return {
        _id: ub._id.toString(),
        userId: ub.userId,
        badgeId: ub.badgeId,
        status: ub.status,
        evidenceUrls: ub.evidenceUrls || [],
        userNote: ub.userNote || [],
        badgeTypeSnapshot: ub.badgeTypeSnapshot,
        submittedAt: ub.submittedAt,
        user: userData ? {
          display_name: userData.display_name || userData.email,
          profile_image_url: userData.profile_image_url || "/avatar/Avatar.png",
          email: userData.email
        } : null,
        badge: badgeData ? {
          name: badgeData.name,
          description: badgeData.description,
          icon_url: badgeData.icon_url,
          badge_type: badgeData.badge_type,
          thumbnail_url: ub.evidenceUrls?.[0] || badgeData.icon_url || null
        } : null
      };
    });

    return NextResponse.json({ 
      data: result,
      meta: {
        totalPending: pendingBadges.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error("Management Hub GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error", detail: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userBadgeId, status, adminComment } = body;

    if (!userBadgeId || !['verified', 'declined'].includes(status)) {
      return NextResponse.json({ error: "Missing ID or invalid status" }, { status: 400 });
    }

    await connect();
    const updated = await UserBadge.findByIdAndUpdate(
      userBadgeId,
      {
        status,
        adminComment,
        adminId: admin.userId,
        verifiedAt: new Date(),
        certificationRequested: false // Close the request
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Badge request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Management Hub POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
