import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    // Aggregate top creators by total likes across all posts
    const top = await Post.aggregate([
      { $group: {
        _id: "$post.user_id",
        totalPosts: { $sum: 1 },
        totalLikes: { $sum: "$post.likes_count" }
      }},
      { $sort: { totalLikes: -1 } },
      { $limit: 3 }
    ]);

    // Fetch user profiles
    const userIds = top.map((t: any) => t._id);
    const users = await User.find({ user_id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u: any) => [u.user_id, u]));

    // Fetch latest 2 posts per creator for thumbnails
    const creators = await Promise.all(
      top.map(async (entry: any, i: number) => {
        const u = userMap.get(entry._id);
        const posts = await Post.find({ "post.user_id": entry._id })
          .sort({ "post.created_at": -1 })
          .limit(2)
          .lean();

        return {
          id: String(i + 1),
          userId: entry._id,
          name: u?.display_name || "Unknown",
          sub_namebio: u?.sub_namebio || u?.bio || "Home Cook",
          followers: "0",
          avatarUrl: u?.profile_image_url || null,
          images: posts.map((p: any) => ({
            url: p.post?.image_url?.[0] || null,
            likes: p.post?.likes_count || 0
          }))
        };
      })
    );

    return NextResponse.json({ success: true, creators });
  } catch (error) {
    console.error("PopularCreations Error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
