import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";

async function getCurrentUserId(req: NextRequest): Promise<string | null> {
  try {
    const session = await getToken({ req, secret: NEXTAUTH_SECRET });
    if (session?.id) return session.id as string;
    if (session?.sub) return session.sub;
  } catch {}
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const decoded: any = jwt.verify(token, JWT_SECRET);
      return decoded.id || decoded.user_id || null;
    } catch {}
  }
  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ data: [] });

  try {
    await connect();

    const currentId = await getCurrentUserId(req);
    let excludeId: string | null = null;
    if (currentId) {
      try {
        const u = await User.findById(currentId).lean()
          || await User.findOne({ user_id: currentId }).lean();
        excludeId = u?._id?.toString() || null;
      } catch {}
    }

    const users = await User.find({
      display_name: { $regex: escapeRegex(q), $options: "i" },
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
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
    console.error("Search error:", error);
    return NextResponse.json({ errors: [{ detail: error.message }] }, { status: 500 });
  }
}
