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

    let rawPosts = [];

    // (Search)
    if (searchQuery) {
      const cleanQuery = searchQuery.replace(/^#/, '');
      rawPosts = await Post.find({
        $or: [
          { "post.content": { $regex: cleanQuery, $options: "i" } },
          { "post.hashtags": cleanQuery }
        ]
      }).sort({ "post.created_at": -1 });

    } 
    // ฟีดหน้าแรกปกติ + มียูสเซอร์ล็อกอินอยู่
    else if (currentUserId) {
      // เช็คไอดีก่อนค้นหา
      const isCurrentValidObjectId = /^[0-9a-fA-F]{24}$/.test(currentUserId);
      const currentUserDoc = await User.findOne({ user_id: currentUserId }) || 
        (isCurrentValidObjectId ? await User.findById(currentUserId) : null);
        
      const matchedUserId = currentUserDoc ? currentUserDoc.user_id : currentUserId;

      const followingList = await Follow.find({ "comment.follower_user_id": matchedUserId })
        .distinct("comment.following_user_id");

      const followedPosts = await Post.find({ "post.user_id": { $in: followingList } })
        .sort({ "post.created_at": -1 })
        .limit(15);

      const otherPosts = await Post.find({ 
        "post.user_id": { $nin: followingList } 
      })
      .sort({ "post.created_at": -1 })
      .limit(15);

      rawPosts = [...followedPosts, ...otherPosts];

    } 
    // ไม่ล็อกอิน
    else {
      rawPosts = await Post.find({}).sort({ "post.created_at": -1 }).limit(30);
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

        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(p.post?.user_id || "");
        
        const creator = await User.findOne({ user_id: p.post?.user_id }) || 
          (isValidObjectId ? await User.findById(p.post?.user_id) : null);

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
              profileImageUrl: creator?.profile_image_url || "/avatar/default.png",
              sub_namebio: creator?.sub_namebio || "Home Cook"
            }
          }
        };
      })
    );

    return NextResponse.json({
      jsonapi: { version: "1.0" },
      data: formattedPosts
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

    const isInputObjectId = /^[0-9a-fA-F]{24}$/.test(attributes.userId);
    let finalUserId = attributes.userId;
    const userDoc = await User.findOne({ user_id: attributes.userId }) || 
      (isInputObjectId ? await User.findById(attributes.userId) : null);
    
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