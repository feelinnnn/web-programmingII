import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Posts from "@/models/Post";
import Bookmark from "@/models/Bookmark";

//{
    //   id: 1,
    //   author: "Wanilla Pie",
    //   role: "Home Cook",
    //   time: "35m ago",
    //   content: "🍜 ผัดซีอิ๊วหมูกรอบ หอม ๆ ทำง่ายมาก!\nเคล็ดลับของจานนี้คือใช้น้ำมันจากหมูกรอบมาผัด จะช่วยเพิ่มความหอมแบบไม่ต้องปรุงเยอะ เพียงใช้ ...",
    //   likes: 123,
    //   comments: 17,
    // },


    //crypto.randomUUID(),
export async function POST(request: Request){
    try {
        await dbConnect(); // อย่าลืม Connect DB ทุกครั้งในแต่ละ Route Handler

        const data = await request.json();
        // 1. แก้ไขการดึงค่า (ไม่มี .body)
        const { postId, userId, targetType } = data; 
        
        if (!postId || !userId || !targetType) {
            return NextResponse.json(
                { errors: [{ status: "400", title: "Bad Request Error" }] },
                { status: 400 }
            );
        }

        // 2. ค้นหาโพสต์และดักจับหากไม่พบข้อมูล
        const postDoc: any = await Posts.findById({postId }).lean();
        if (!postDoc) {
            return NextResponse.json(
                { errors: [{ status: "404", title: "Post Not Found" }] },
                { status: 404 }
            );
        }
        
        // ดึง user_id ของเจ้าของโพสต์ (ตามโค้ดเดิมของคุณ)
        const targetId = postDoc.post.user_id; 

        const newBookmark = {
            bookmark_id: crypto.randomUUID(),
            user_id: userId,
            target_id: targetId,
            target_type: targetType, // มั่นใจว่าหน้าบ้านส่งมาและไม่เป็น undefined
            post_id: postId,
            created_at: new Date()
        };

        // ส่งแบบซ้อนก้อนตามที่ Schema กำหนดไว้
        const insertBookmark = await Bookmark.create({
            bookmark: newBookmark 
});

        // 4. Mongoose .create() ถ้าสำเร็จจะส่ง Object กลับมา ถ้าล้มเหลวจะ throw error ไปที่ catch
        if (insertBookmark) {
            return NextResponse.json({ 
                insertBookmark
            },);
        } else {
            return NextResponse.json(
                { errors: [{ status: "500", title: "Fail to create bookmark Error" }] },
                { status: 500 }
            );
        }
    }
    catch (err) {
        console.error("POST Bookmark Error:", err); // console.log ไว้ดูฝั่ง server เวลาติดขัด
        return NextResponse.json(
            { errors: [{ status: "500", title: "Internal Server Error" }] },
            { status: 500 }
        );
    }
}
export async function GET(request: Request) {
  try{
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if(!userId){
        return NextResponse.json({ errors: [{ status: "400", title: "Bad Request",}] },
        { status: 400 })
    }

    const bookmarks = await Bookmark.find({ "bookmark.user_id": userId })
                                    .sort({ "bookmark.created_at": -1 })
                                    .lean();
    return NextResponse.json({ 
        success: true, 
        count: bookmarks.length,
        data: bookmarks 
    });
  
                                }
  
  catch(err){
    return NextResponse.json({ errors: [{ status: "500", title: "Internal Server Error",}] },
        { status: 500 })
  }
}