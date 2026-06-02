import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import Posts from "@/models/Post";
import Users from "@/models/User"; // 👈 1. Import โมเดล User เข้ามาเพิ่ม

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // ขั้นตอนที่ 1: ดึง Bookmarks ทั้งหมดของคนที่เรียกดูมาเก็บไว้
    const bookmarks = await Bookmark.find({ "bookmark.user_id": userId }).lean();
    const postIds = bookmarks.map(item => item.bookmark.post_id);

    // ขั้นตอนที่ 2: ดึงคอลเลกชันโพสต์ตัวเต็มที่มีรหัสตรงกันออกมารวมกัน
    // (สมมติว่าไอดีโพสต์ในโมเดลคุณเก็บอยู่ที่ฟิลด์ "_id" หรือ "post.post_id" ให้ปรับตามจริงนะครับ)
    const bookmarkedPosts: any[] = await Posts.find({ 
      "_id": { $in: postIds } 
    }).lean();

    // ขั้นตอนที่ 3: 🔑 แตกกลุ่มเอาเฉพาะ user_id ของ "เจ้าของโพสต์" เหล่านั้นออกมารวบรวมไว้
    // (สมมติว่าโพสต์ของคุณเก็บไอดีคนโพสต์ไว้ที่ฟิลด์ "author_id" หรือ "post.user_id" ให้ปรับให้ตรงนะครับ)
    const authorIds = bookmarkedPosts.map(post => post.author_id || post.post?.user_id);

    // ขั้นตอนที่ 4: วิ่งไปค้นหาข้อมูลผู้ใช้เฉพาะกลุ่มคนที่เป็นเจ้าของโพสต์เหล่านั้นขึ้นมา
    const usersList = await Users.find({ 
      "user_id": { $in: authorIds } 
    }).lean();

    // ขั้นตอนที่ 5: 🏎️ ทำโครงสร้างจับคู่ (Map Mapping) เพื่อให้ดึงข้อมูลได้เร็วขึ้น ไม่ต้องวนลูปซ้อนลูป
    const userMap = new Map();
    usersList.forEach(user => {
      userMap.set(user.user_id, {
        role: user.role,                         // 👈 ได้ role ที่ต้องการแล้ว!
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        sub_namebio: user.sub_namebio
      });
    });

    // ขั้นตอนที่ 6: เอาข้อมูลโพสต์ตัวเต็ม มาประกอบร่างรวมกับข้อมูลของผู้ใช้ที่เป็นเจ้าของโพสต์
    const fullMergedData = bookmarkedPosts.map(post => {
      const creatorId = post.author_id || post.post?.user_id;
      const creatorInfo = userMap.get(creatorId) || { role: "user", display_name: "Unknown User" }; // ข้อมูลสำรองเผื่อไม่พบข้อมูลผู้ใช้

      return {
        ...post,
        // ผูกก้อนข้อมูลประวัติและ Role ของเจ้าของโพสต์ลงไปตรงนี้เลย!
        creatorProfile: creatorInfo 
      };
    });

    // คืนค่ากลับไปให้หน้าบ้านใช้งานอย่างเอร็ดอร่อย
    return NextResponse.json({ success: true, data: fullMergedData });

  } catch (error) {
    console.error("Fetch Bookmarked Posts with Creator Role Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}