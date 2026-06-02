import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Comment from "@/models/Comment";
import User from "@/models/User";

// GET: 
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    if (!postId) return NextResponse.json({ success: false, error: "Missing postId" }, { status: 400 });

    await dbConnect();
    const comments = await Comment.find({ "comment.post_id": postId }).sort({ "comment.created_at": 1 }).lean();

    // ดึงข้อมูล User มา map เพื่อแสดงชื่อและรูป
    const userIds = [...new Set(comments.map((c: any) => c.comment.user_id))];
    const users = await User.find({ user_id: { $in: userIds } }).lean();
    const userMap = new Map(users.map((u: any) => [u.user_id, u]));

    const formattedComments = comments.map((doc: any) => {
      const c = doc.comment;
      const u = userMap.get(c.user_id);
      return {
        id: c.comment_id,
        postId: c.post_id,
        userId: c.user_id,
        content: c.content,
        createdAt: c.created_at,
        author: u?.display_name || "Unknown",
        avatarUrl: u?.profile_image_url || "/avatar/Avatar.png"
      };
    });

    return NextResponse.json({ success: true, comments: formattedComments });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: เพิ่มคอมเมนต์ใหม่ (Session และ JWT)
export async function POST(request: Request) {
  try {
    await dbConnect();

    // 1. ตรวจสอบ User ID จาก NextAuth Session หรือ JWT Header
    let currentUserId: string | null = null;

    // ตรวจสอบจาก NextAuth
    const session = await getServerSession();
    if (session?.user?.id) {
      currentUserId = session.user.id as string;
    }

    // ถ้าไม่มี session ให้ตรวจสอบจาก Authorization Header (JWT)
    if (!currentUserId) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.split(" ")[1];
          const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
          currentUserId = decoded.user_id || decoded.id;
        } catch (err) {
          console.error("JWT Verification failed:", err);
        }
      }
    }

    // ถ้าไม่ผ่านทั้ง 2 วิธี
    if (!currentUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { postId, content } = await request.json();

    const newCommentData = {
      comment_id: crypto.randomUUID(),
      post_id: postId,
      user_id: currentUserId,
      content,
      created_at: new Date()
    };

    await Comment.create({ comment: newCommentData });

    // ดึงข้อมูลผู้ใช้ที่เพิ่งคอมเมนต์
    const user = await User.findOne({ user_id: currentUserId }).lean();
    
    return NextResponse.json({ 
      success: true, 
      comment: {
        id: newCommentData.comment_id,
        postId: newCommentData.post_id,
        userId: newCommentData.user_id,
        content: newCommentData.content,
        createdAt: newCommentData.created_at,
        author: (user as any)?.display_name || "User",
        avatarUrl: (user as any)?.profile_image_url || "/avatar/Avatar.png"
      } 
    });
  } catch (error) {
    console.error("POST Comment Error:", error);
    return NextResponse.json({ success: false, error: "Failed to post" }, { status: 500 });
  }
}