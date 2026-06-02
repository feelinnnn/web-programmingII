import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";

export async function GET() {
  try {
    await dbConnect();

    const popularHashtags = await Post.aggregate([
      { $match: { "post.hashtags": { $exists: true, $ne: [] } } },
      { $unwind: "$post.hashtags" },
      { $group: { _id: "$post.hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const formattedTags = popularHashtags.map((item, index) => ({
      rank: index + 1,
      tag: `${item._id.startsWith('#') ? '' : '#'}${item._id}`, // เพิ่ม # ถ้าไม่มี
      posts: item.count,
      hot: index === 0
    }));

    return NextResponse.json({ success: true, hashtags: formattedTags });
  } catch (error) {
    console.error("Hashtag Aggregation Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}