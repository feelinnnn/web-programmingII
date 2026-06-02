import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ data: [] });
  }

  try {
    await connect();

    const users = await User.find({
      display_name: { $regex: q, $options: "i" },
    })
      .select("display_name profile_image_url sub_namebio")
      .limit(5)
      .lean();

    const results = users.map((u: any) => ({
      id: u._id,
      display_name: u.display_name,
      profile_image_url: u.profile_image_url,
      sub_namebio: u.sub_namebio || "",
    }));

    return NextResponse.json({ data: results });
  } catch (error: any) {
    return NextResponse.json(
      { errors: [{ detail: error.message }] },
      { status: 500 }
    );
  }
}
