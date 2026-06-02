import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import mongoose from "mongoose";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import UserBadge from "@/models/UserBadge";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";

async function getUserId(req: NextRequest): Promise<string | null> {
  try {
    const session = await getToken({ req, secret: NEXTAUTH_SECRET });
    if (session?.id) return session.id as string;
    if (session?.sub) return session.sub;
  } catch {}

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded: any = jwt.verify(token, JWT_SECRET);
      return decoded.id || null;
    } catch {}
  }
  return null;
}

export async function PATCH(req: NextRequest) {
  try {
    await connect();
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json({ errors: [{ detail: "Unauthorized" }] }, { status: 401 });
    }

    const user = await User.findOne({ user_id: userId }).lean()
      || await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ errors: [{ detail: "User not found" }] }, { status: 404 });
    }

    const authUserId = user.user_id || user._id.toString();
    const { badgeIds } = await req.json();

    if (!Array.isArray(badgeIds)) {
      return NextResponse.json({ errors: [{ detail: "badgeIds must be an array" }] }, { status: 400 });
    }

    // Same query as GET /api/profile
    const resetResult = await UserBadge.updateMany(
      { userId: authUserId },
      { $set: { showcased: false } }
    );

    // Set selected
    let setResult = { modifiedCount: 0 };
    if (badgeIds.length > 0) {
      const ids = badgeIds.map((id: string) => new mongoose.Types.ObjectId(id));
      setResult = await UserBadge.updateMany(
        { _id: { $in: ids } },
        { $set: { showcased: true } }
      );
    }

    return NextResponse.json({
      success: true,
      showcasedCount: badgeIds.length,
      authUserId,
      resetMatched: resetResult.matchedCount,
      resetModified: resetResult.modifiedCount,
      setModified: setResult.modifiedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ errors: [{ detail: error.message }] }, { status: 500 });
  }
}
