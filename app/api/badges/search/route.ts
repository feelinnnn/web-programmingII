import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Badge from "@/models/Badge";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  const type = req.nextUrl.searchParams.get("type") || "";

  try {
    await connect();
    const filter: any = {};
    if (q.trim()) filter.name = { $regex: q, $options: "i" };
    if (type) filter.badge_type = type;

    const badges = await Badge.find(filter).limit(10).lean();
    return NextResponse.json({
      data: badges.map((b: any) => ({
        id: b._id,
        name: b.name,
        badge_type: b.badge_type,
        icon_url: b.icon_url,
        description: b.description,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ errors: [{ detail: error.message }] }, { status: 500 });
  }
}
