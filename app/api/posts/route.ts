import { NextResponse } from "next/server";

import connectDB  from "@/lib/mongodb";
import Post from "@/models/Post";
import Badge from "@/models/Badge";

export async function GET() {
  try {
    await connectDB();

    const posts = await Post.find();

    console.log(posts)

    return NextResponse.json(posts);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}