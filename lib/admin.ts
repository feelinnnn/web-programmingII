import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import connect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "COOKCULT_SECRET_KEY";

export async function isAdmin(req: NextRequest): Promise<{userId: string, email: string} | null> {
  let decoded: any = null;

  // 1. Check Bearer Token first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      if (token && token !== "null") {
        decoded = jwt.verify(token, JWT_SECRET);
      }
    } catch (err) {}
  }

  // 2. Check NextAuth Session
  if (!decoded) {
    try {
      decoded = await getToken({ req, secret: NEXTAUTH_SECRET });
    } catch (err) {}
  }

  if (!decoded) return null;

  const email = decoded.email;
  const userId = decoded.id || decoded.user_id || decoded.sub;

  if (!email && !userId) return null;

  // Instant bypass for hardcoded admin email
  if (email === "admin@cookcult.com") return { userId: userId || "admin-fixed-id-001", email };

  await connect();
  
  const query: any = {};
  if (email) query.email = email;
  if (userId) {
    if (query.email) {
      query.$or = [{ user_id: userId }, { email: email }];
      if (userId.length === 24) query.$or.push({ _id: userId });
      delete query.email;
    } else {
      query.$or = [{ user_id: userId }];
      if (userId.length === 24) query.$or.push({ _id: userId });
    }
  }

  const user = await User.findOne(query, { role: 1, user_id: 1, email: 1 }).lean();

  if (user?.role === "admin") {
    return { 
      userId: user.user_id || user._id.toString(), 
      email: user.email 
    };
  }
  
  return null;
}
