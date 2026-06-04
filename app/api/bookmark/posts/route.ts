import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import Posts from "@/models/Post";
import Users from "@/models/User";
import Like from "@/models/Like";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // 1. Get all bookmarks for this user
    const bookmarks = await Bookmark.find({ "bookmark.user_id": userId }).lean();
    const allPostIds = bookmarks.map(item => item.bookmark.post_id);
    const total = allPostIds.length;

    if (total === 0) {
      return NextResponse.json({ data: [], meta: { skip: 0, limit, total: 0, hasMore: false } });
    }

    // 2. Get full post documents for all bookmarked posts
    const allBookmarkedPosts: any[] = await Posts.find({ "_id": { $in: allPostIds } }).lean();

    // Sort by newest first
    allBookmarkedPosts.sort((a, b) =>
      new Date(b.post?.created_at || b.createdAt).getTime() -
      new Date(a.post?.created_at || a.createdAt).getTime()
    );

    // Apply pagination
    const paginatedPosts = allBookmarkedPosts.slice(skip, skip + limit);

    // 3. Collect creator user_ids and look up users
    const authorIds = paginatedPosts.map(post => post.author_id || post.post?.user_id);
    const usersList = await Users.find({ "user_id": { $in: authorIds } }).lean();

    // Also try findById for authors not found by user_id
    const foundIds = new Set(usersList.map((u: any) => u.user_id));
    const missingIds = authorIds.filter(id => id && !foundIds.has(id));
    if (missingIds.length > 0) {
      for (const mid of missingIds) {
        if (/^[0-9a-fA-F]{24}$/.test(mid)) {
          try {
            const u = await Users.findById(mid).lean();
            if (u && !foundIds.has(u.user_id)) {
              usersList.push(u);
              foundIds.add(u.user_id);
            }
          } catch {}
        }
      }
    }

    const userMap = new Map();
    usersList.forEach((user: any) => {
      userMap.set(user.user_id, user);
      userMap.set(user._id.toString(), user);
    });

    // 4. Check like status for current user (for paginated posts)
    const paginatedPostIds = paginatedPosts.map(p => p._id.toString());
    const likedPostIds = new Set(
      (await Like.find({ user_id: userId, post_id: { $in: paginatedPostIds } }).lean())
        .map((l: any) => l.post_id)
    );

    // 5. Format posts in JSON:API format matching /api/posts
    const formattedPosts = paginatedPosts.map(item => {
      const postData = item.post;
      const creatorId = postData?.user_id;
      const userDoc = userMap.get(creatorId);

      return {
        id: item._id.toString(),
        type: "post",
        attributes: {
          postId: postData?.post_id || item._id.toString(),
          userId: creatorId || "",
          content: postData?.content || "",
          hashtags: postData?.hashtags || [],
          imageUrls: postData?.image_url || [],
          recipeUrl: postData?.recipe_url || "",
          likesCount: postData?.likes_count ?? 0,
          commentsCount: postData?.comments_count ?? 0,
          createdAt: postData?.created_at || item.createdAt,
          isLiked: likedPostIds.has(item._id.toString()),
          creator: {
            displayName: userDoc?.display_name || "Unknown User",
            profileImageUrl: userDoc?.profile_image_url || "/avatar/Avatar.png",
            sub_namebio: userDoc?.sub_namebio || "Home Cook"
          }
        }
      };
    });

    return NextResponse.json({
      data: formattedPosts,
      meta: { skip, limit, total, hasMore: skip + limit < total }
    });

  } catch (error) {
    console.error("Fetch Bookmarked Posts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
