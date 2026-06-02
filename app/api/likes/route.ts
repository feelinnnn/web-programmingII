import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Like from "@/models/Like";
import Post from "@/models/Post";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { user_id, post_id } = await request.json();

    if (!user_id || !post_id) {
      return NextResponse.json({ error: "Missing user_id or post_id" }, { status: 400 });
    }

    // 1. ตรวจสอบว่าผู้ใช้คนนี้เคยไลค์โพสต์นี้ไปหรือยัง
    const existingLike = await Like.findOne({ user_id, post_id });

    // เตรียม ObjectId สำหรับค้นหาใน Post
    // ลองแปลงเป็น ObjectId เผื่อไว้ในกรณีที่ฐานข้อมูลใช้ ObjectId
    const postQuery = mongoose.Types.ObjectId.isValid(post_id) 
      ? { _id: new mongoose.Types.ObjectId(post_id) } 
      : { "post.post_id": post_id };

    if (existingLike) {
      // --- UNLIKE ---
      await Like.deleteOne({ _id: existingLike._id });
      
      // ใช้ $inc: -1 เพื่อลดจำนวนไลค์
      const updatedPost = await Post.findOneAndUpdate(
        postQuery,
        { $inc: { "post.likes_count": -1 } },
        { returnDocument: 'after' }
      );

      const totalLikes = updatedPost ? updatedPost.post.likes_count : 0;
      
      return NextResponse.json({ 
        message: "Unliked successfully", 
        isLiked: false, 
        likesCount: totalLikes 
      }, { status: 200 });

    } else {
      // --- LIKE ---
      await Like.create({ user_id, post_id });
      
      // ใช้ $inc: 1 เพื่อเพิ่มจำนวนไลค์
      const updatedPost = await Post.findOneAndUpdate(
        postQuery,
        { $inc: { "post.likes_count": 1 } },
        { returnDocument: 'after' }
      );

      const totalLikes = updatedPost ? updatedPost.post.likes_count : 1;

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