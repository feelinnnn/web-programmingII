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
      { $match: { totalLikes: { $gt: 0 } } },
      { $sort: { totalLikes: -1 } },
      { $limit: 3 }
    ]);

    // Fetch user profiles
    const userIds = top.map((t: any) => t._id);
    const users = await User.find({ user_id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u: any) => [u.user_id, u]));

    // Fetch top 2 most LIKED posts per creator
    const creators = await Promise.all(
      top.map(async (entry: any, i: number) => {
        const u = userMap.get(entry._id);
        const posts = await Post.find({ "post.user_id": entry._id, "post.likes_count": { $gt: 0 } })
          .sort({ "post.likes_count": -1 })
          .limit(2)
          .lean();

        const totalTopLikes = posts.reduce((sum: number, p: any) => sum + (p.post?.likes_count || 0), 0);

        return {
          id: String(i + 1),
          userId: u?.user_id || entry._id,
          name: u?.display_name || "Unknown",
          sub_namebio: u?.sub_namebio || u?.bio || "Home Cook",
          followers: "0",
          avatarUrl: u?.profile_image_url || null,
          totalTopLikes,
          images: posts.length > 0 ? posts.map((p: any) => ({
            postId: p._id.toString(),
            url: p.post?.image_url?.[0] || null,
            likes: p.post?.likes_count || 0
          })) : [{ postId: null, url: null, likes: 0 }]
        };
      })
    );

    // Re-sort by totalTopLikes from their 2 best posts
    creators.sort((a, b) => b.totalTopLikes - a.totalTopLikes);

    return NextResponse.json({ success: true, creators });
  } catch (error) {
    console.error("PopularCreations Error:", error);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
