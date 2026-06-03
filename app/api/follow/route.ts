import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Follow from "@/models/Follow";
import User from "@/models/User";

async function resolveUserId(rawId: string): Promise<string> {
  const user = await User.findOne({ user_id: rawId }).lean()
    || await User.findById(rawId).lean();
  return user ? (user.user_id || user._id.toString()) : rawId;
}

// POST /api/follow — toggle follow/unfollow
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { followerUserId, followingUserId } = await req.json();

    if (!followerUserId || !followingUserId) {
      return NextResponse.json(
        { errors: [{ status: "400", title: "Bad Request", detail: "Missing followerUserId or followingUserId" }] },
        { status: 400 }
      );
    }

    // Resolve both IDs to user_id format
    const fid = await resolveUserId(followerUserId);
    const tid = await resolveUserId(followingUserId);

    const existing = await Follow.findOne({
      "comment.follower_user_id": fid,
      "comment.following_user_id": tid
    });

    if (existing) {
      // Unfollow
      await Follow.deleteOne({ _id: existing._id });
      return NextResponse.json({
        data: { isFollowing: false, message: "Unfollowed" }
      });
    }

    // Follow
    await Follow.create({
      comment: {
        follow_id: crypto.randomUUID(),
        follower_user_id: fid,
        following_user_id: tid,
        created_at: new Date()
      }
    });

    return NextResponse.json(
      { data: { isFollowing: true, message: "Followed" } },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ detail: error.message }] },
      { status: 500 }
    );
  }
}

// GET /api/follow?followerUserId=&followingUserId= — check if following
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const followerUserId = searchParams.get("followerUserId");
    const followingUserId = searchParams.get("followingUserId");

    if (!followerUserId || !followingUserId) {
      return NextResponse.json({ data: { isFollowing: false } });
    }

    const fid = await resolveUserId(followerUserId);
    const tid = await resolveUserId(followingUserId);

    const existing = await Follow.findOne({
      "comment.follower_user_id": fid,
      "comment.following_user_id": tid
    });

    return NextResponse.json({
      data: { isFollowing: !!existing }
    });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ detail: error.message }] },
      { status: 500 }
    );
  }
}
