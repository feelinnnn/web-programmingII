import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import Posts from "@/models/Post";
import Users from "@/models/User";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // 1. ดึงข้อมูลบุ๊กมาร์กทั้งหมดของ user นี้
    const bookmarks = await Bookmark.find({ "bookmark.user_id": userId }).lean();
    const postIds = bookmarks.map(item => item.bookmark.post_id);

    // 2. ดึงข้อมูลโพสต์ตัวเต็มที่มีไอดีตรงกับที่เซฟไว้
    const bookmarkedPosts: any[] = await Posts.find({ "_id": { $in: postIds } }).lean();

    // 3. รวบรวมไอดีเจ้าของโพสต์เพื่อไปหาข้อมูล User
    const authorIds = bookmarkedPosts.map(post => post.author_id || post.post?.user_id);
    const usersList = await Users.find({ "user_id": { $in: authorIds } }).lean();

    // 4. ทำ Map ของ User ไว้สำหรับจับคู่ข้อมูล
    const userMap = new Map();
    usersList.forEach(user => {
      userMap.set(user.user_id, user);
    });

    // 5. 🔑 🛠️ แปลงรูปทรงข้อมูลจากโครงสร้าง DB ซับซ้อน ให้กลายเป็น Object แบนเรียบ
   // 🔑 แก้ไขขั้นตอนที่ 5 ใน Route หลังบ้านของคุญให้ถูกต้อง:

const flatPosts = bookmarkedPosts.map(item => {
  // item คือเอกสารก้อนใหญ่ 
  // postData คือวัตถุภายในที่มีข้อมูลโพสต์จริง ๆ { post_id, content, created_at, ... }
  const postData = item.post; 

  const creatorId = postData?.user_id;
  const userDoc = userMap.get(creatorId);

  return {
    id: item._id.toString(), 
    author: userDoc?.display_name || "Unknown User",
    role: userDoc?.sub_namebio || userDoc?.role || "user", 
    
    // 🎯 🛠️ แก้ไขตรงนี้: เปลี่ยนจาก post.created_at เป็น postData.created_at ให้ถูกตัว!
    time: postData?.created_at ? new Date(postData.created_at).toISOString() : new Date().toISOString(), 
    
    content: postData?.content || "",
    likes: postData?.likes_count ?? 0,
    comments: postData?.comments_count ?? 0,
    imageUrls: postData?.image_url || []
  };
});

    // คืนค่ากลับไปในฟิลด์ data
    return NextResponse.json({ success: true, data: flatPosts });

  } catch (error) {
    console.error("Fetch Flat Bookmarked Posts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}