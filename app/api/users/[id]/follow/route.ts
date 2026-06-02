import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connect from "@/lib/mongodb";
import Follow from "@/models/Follow";
import User from "@/models/User";
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
      return decoded.user_id || decoded.id || null;
    } catch {}
  }
  return null;
}

// GET - check follow status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileUserId } = await params;
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ following: false });

    await connect();
    const user = await User.findById(profileUserId).lean();
    if (!user) return NextResponse.json({ following: false });

    const authUserId = userId;
    const targetId = user.user_id || user._id.toString();
    const existing = await Follow.findOne({
      "comment.follower_user_id": authUserId,
      "comment.following_user_id": targetId,
    });
    return NextResponse.json({ following: !!existing });
  } catch {
    return NextResponse.json({ following: false });
  }
}

// POST - toggle follow
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: profileUserId } = await params;
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ errors: [{ detail: "Unauthorized" }] }, { status: 401 });

    await connect();
    const user = await User.findById(profileUserId).lean();
    if (!user) return NextResponse.json({ errors: [{ detail: "User not found" }] }, { status: 404 });

    const authUserId = userId;
    const targetId = user.user_id || user._id.toString();

    const existing = await Follow.findOne({
      "comment.follower_user_id": authUserId,
      "comment.following_user_id": targetId,
    });

    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      return NextResponse.json({ following: false });
    } else {
      await Follow.create({
        comment: {
          follower_user_id: authUserId,
          following_user_id: targetId,
        },
      });
      return NextResponse.json({ following: true });
    }
  } catch (error: any) {
    console.error("Follow error:", error.message || error);
    return NextResponse.json({ errors: [{ detail: error.message || String(error) }] }, { status: 500 });
  }
}
