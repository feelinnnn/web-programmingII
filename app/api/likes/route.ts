import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Like from "@/models/Like";
import Post from "@/models/Post";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { user_id, post_id } = await request.json();

    if (!user_id || !post_id) {
      return NextResponse.json({ error: "Missing user_id or post_id" }, { status: 400 });
    }

    // ตรวจสอบว่าผู้ใช้คนนี้เคยไลค์โพสต์นี้ไปหรือยัง
    const existingLike = await Like.findOne({ user_id, post_id });

    if (existingLike) {
      // ถ้าเคยไลค์แล้ว -> ยกเลิกการไลค์ (Unlike)
      await Like.deleteOne({ _id: existingLike._id });
      
      // ดึงจำนวนไลค์ล่าสุดของโพสต์นี้
      const totalLikes = await Like.countDocuments({ post_id });
      
      await Post.findOneAndUpdate(
        { 
          $or: [
            { _id: post_id },
            { "post.post_id": post_id }
          ] 
        },
        { $set: { "post.likes_count": totalLikes } }
      );
      
      return NextResponse.json({ 
        message: "Unliked successfully", 
        isLiked: false, 
        likesCount: totalLikes 
      }, { status: 200 });

    } else {
      // ถ้ายังไม่เคยไลค์ -> บันทึกการไลค์ใหม่ (Like)
      await Like.create({ user_id, post_id });
      
      // ดึงจำนวนไลค์ล่าสุด
      const totalLikes = await Like.countDocuments({ post_id });

      // 🔄 อัปเดตยอดลงโครงสร้างลูกคั้บ
      await Post.findOneAndUpdate(
        { 
          $or: [
            { _id: post_id },
            { "post.post_id": post_id }
          ] 
        },
        { $set: { "post.likes_count": totalLikes } }
      );

      return NextResponse.json({ 
        message: "Liked successfully", 
        isLiked: true, 
        likesCount: totalLikes 
      }, { status: 201 });
    }
  } catch (error) {
    console.error("Like API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}