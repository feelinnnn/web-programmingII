import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Follow from "@/models/Follow";
import User from "@/models/User";
import Like from "@/models/Like"; 

// GET: ดึงฟีดโพสต์คอมมู
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const currentUserId = searchParams.get("currentUserId");
    const creatorId = searchParams.get("creatorId");
    const postId = searchParams.get("postId");
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "10");

    let rawPosts: any[] = [];
    let total = 0;

    // Filter by specific post
    if (postId) {
      const post = await Post.findById(postId).lean();
      rawPosts = post ? [post] : [];
      total = rawPosts.length;
    }
    // Filter by creator
    else if (creatorId) {
      total = await Post.countDocuments({ "post.user_id": creatorId });
      rawPosts = await Post.find({ "post.user_id": creatorId })
        .sort({ "post.created_at": -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }
    // (Search)
    else if (searchQuery) {
      const cleanQuery = searchQuery.replace(/^#/, '');
      const filter = {
        $or: [
          { "post.content": { $regex: cleanQuery, $options: "i" } },
          { "post.hashtags": cleanQuery }
        ]
      };
      total = await Post.countDocuments(filter);
      rawPosts = await Post.find(filter)
        .sort({ "post.created_at": -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }
    // ฟีดหน้าแรกปกติ + มียูสเซอร์ล็อกอินอยู่
    else if (currentUserId) {
      const isCurrentValidObjectId = /^[0-9a-fA-F]{24}$/.test(currentUserId);
      let currentUserDoc = await User.findOne({ user_id: currentUserId });
      if (!currentUserDoc && isCurrentValidObjectId) {
        currentUserDoc = await User.findById(currentUserId);
      }
      if (!currentUserDoc) {
        try { currentUserDoc = await User.findById(currentUserId); } catch {}
      }

      const matchedUserId = currentUserDoc ? currentUserDoc.user_id : currentUserId;

      const followingList = await Follow.find({ "comment.follower_user_id": matchedUserId })
        .distinct("comment.following_user_id");

      // Total: all posts
      total = await Post.countDocuments({});

      // Followed posts first, then others — apply skip/limit across combined results
      const allPosts = await Post.find({})
        .sort({ "post.created_at": -1 })
        .lean();

      // Sort manually: followed first, then others
      const seen = new Set();
      const combined: any[] = [];
      for (const p of allPosts) {
        const pid = p._id.toString();
        if (seen.has(pid)) continue;
        seen.add(pid);
        if (followingList.includes(p.post?.user_id)) {
          combined.unshift(p); // followed first
        } else {
          combined.push(p);
        }
      }
      rawPosts = combined.slice(skip, skip + limit);
    }
    // ไม่ล็อกอิน
    else {
      total = await Post.countDocuments({});
      rawPosts = await Post.find({})
        .sort({ "post.created_at": -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const formattedPosts = await Promise.all(
      rawPosts.map(async (p) => {
        const postIdStr = p._id.toString();
        let isLiked = false;

        // ถ้าผู้ใช้ล็อกอินอยู่ ให้ลองไปค้นในคอลเลกชัน likes ว่าเคยมีประวัติกดไลก์โพสต์นี้ไหม
        if (currentUserId) {
          const hasLike = await Like.findOne({
            user_id: currentUserId,
            post_id: postIdStr
          });
          if (hasLike) {
            isLiked = true; // ถ้าเจอประวัติ ให้เซ็ตเป็น true เพื่อเปิดหัวใจสีแดง
          }
        }

        const postUserId = p.post?.user_id || "";
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(postUserId);

        // Try finding creator by user_id field first, then by MongoDB _id as fallback
        let creator = await User.findOne({ user_id: postUserId });
        if (!creator && isValidObjectId) {
          // post.user_id is a MongoDB ObjectId string → try _id lookup (matches local auth users)
          creator = await User.findById(postUserId);
        }
        if (!creator) {
          // Last resort: try _id lookup for any format (may throw for non-ObjectId strings)
          try { creator = await User.findById(postUserId); } catch {}
        }

        return {
          id: postIdStr,
          type: "post",
          attributes: {
            postId: p.post?.post_id || postIdStr,
            userId: p.post?.user_id || "",
            content: p.post?.content || "",
            hashtags: p.post?.hashtags || [],
            imageUrls: p.post?.image_url || [], 
            recipeUrl: p.post?.recipe_url || "",
            likesCount: p.post?.likes_count || 0,
            commentsCount: p.post?.comments_count || 0,
            createdAt: p.post?.created_at || p.createdAt,
            isLiked: isLiked, 
            creator: {
              displayName: creator?.display_name || "Unknown User",
              profileImageUrl: creator?.profile_image_url || "/avatar/Avatar.png",
              sub_namebio: creator?.sub_namebio || "Home Cook"
            }
          }
        };
      })
    );

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      data: formattedPosts,
      meta: { skip, limit, total, hasMore: skip + limit < total }
    });

  } catch (error: any) {
    console.error("GET /api/posts Error:", error);
    return NextResponse.json(
      { errors: [{ status: "500", title: "Internal Server Error", detail: error.message }] },
      { status: 500 }
    );
  }
}

// POST: สร้างโพสต์ใหม่ลงคอมมู 
export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const attributes = body?.data?.attributes;

    if (!attributes || !attributes.content || !attributes.userId) {
      return NextResponse.json(
        { errors: [{ status: "400", title: "Bad Request", detail: "Missing required fields: content or userId" }] },
        { status: 400 }
      );
    }

    let finalUserId = attributes.userId;
    let userDoc = await User.findOne({ user_id: attributes.userId });
    if (!userDoc && /^[0-9a-fA-F]{24}$/.test(attributes.userId)) {
      userDoc = await User.findById(attributes.userId);
    }
    if (!userDoc) {
      try { userDoc = await User.findById(attributes.userId); } catch {}
    }
    
    if (userDoc) {
      finalUserId = userDoc.user_id || userDoc._id.toString();
    }

    const newPostId = new (require("mongoose").Types.ObjectId)().toString();
    const detectedHashtags = attributes.content.match(/#[\wก-๙]+/g) || [];

    const newPostData = {
      post: {
        post_id: newPostId,
        user_id: finalUserId, 
        content: attributes.content,
        hashtags: attributes.hashtags && attributes.hashtags.length > 0 ? attributes.hashtags : detectedHashtags,
        image_url: attributes.imageUrls || [], 
        recipe_url: attributes.recipeUrl || "",
        likes_count: 0,
        comments_count: 0,
        created_at: new Date()
      }
    };

    const savedPost = await Post.create(newPostData);

    return NextResponse.json(
      {
        message: "Post created successfully!",
        data: {
          id: savedPost._id.toString(),
          type: "post",
          attributes: savedPost.post
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("POST /api/posts Error:", error);
    return NextResponse.json(
      { errors: [{ status: "500", title: "Internal Server Error", detail: error.message }] },
      { status: 500 }
    );
  }
}

// DELETE: สั่งลบโพสต์คอมมู 
export async function DELETE(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); 
    const currentUserId = searchParams.get("currentUserId"); 

    if (!id || !currentUserId) {
      return NextResponse.json(
        { errors: [{ status: "400", title: "Bad Request", detail: "Missing id or currentUserId" }] },
        { status: 400 }
      );
    }

    const userDoc = await User.findOne({ user_id: currentUserId }) || await User.findById(currentUserId);
    const matchedUserId = userDoc ? userDoc.user_id : currentUserId;

    const deletedPost = await Post.findOneAndDelete({
      _id: id,
      "post.user_id": matchedUserId
    });

    if (!deletedPost) {
      return NextResponse.json(
        { errors: [{ status: "403", title: "Forbidden", detail: "you are not the owner of this post" }] },
        { status: 403 }
      );
    }

    return NextResponse.json({ message: "Post deleted successfully!" }, { status: 200 });

  } catch (error: any) {
    console.error("DELETE /api/posts Error:", error);
    return NextResponse.json(
      { errors: [{ status: "500", title: "Internal Server Error", detail: error.message }] },
      { status: 500 }
    );
  }
}

// 4. PATCH: แก้ไข/อัปเดตโพสต์คอมมู
export async function PATCH(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const postId = body?.id || body?.data?.id;
    const content = body?.content || body?.data?.attributes?.content;
    const userId = body?.userId || body?.data?.attributes?.userId;
    const imageUrls = body?.imageUrls || body?.data?.attributes?.imageUrls;
    const hashtags = body?.hashtags || body?.data?.attributes?.hashtags;

    // ตรวจสอบเช็คความครบถ้วนของข้อมูล
    if (!postId || !content || !userId) {
      return NextResponse.json(
        { errors: [{ status: "400", title: "Bad Request", detail: "Missing required fields: id, content, or userId" }] },
        { status: 400 }
      );
    }

    const userDoc = await User.findOne({ user_id: userId }) || await User.findById(userId);
    const matchedUserId = userDoc ? userDoc.user_id : userId;

    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: postId,
        "post.user_id": matchedUserId
      },
      {
        $set: {
          "post.content": content,
          "post.image_url": imageUrls || [], 
          "post.hashtags": (hashtags && hashtags.length > 0) ? hashtags : (content.match(/#[\wก-๙]+/g) || [])
        }
      },
      { new: true } 
    );

    if (!updatedPost) {
      return NextResponse.json(
        { errors: [{ status: "403", title: "Forbidden", detail: "you are not the owner of this post" }] },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: "Post updated successfully!",
      data: {
        id: updatedPost._id.toString(),
        type: "post",
        attributes: updatedPost.post
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("PATCH /api/posts Error:", error);
    return NextResponse.json(
      { errors: [{ status: "500", title: "Internal Server Error", detail: error.message }] },
      { status: 500 }
    );
  }
}