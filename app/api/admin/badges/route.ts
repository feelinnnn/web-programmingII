import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import Badge from "@/models/Badge";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connect();
    const badges = await Badge.find().sort({ name: 1 }).lean();

    return NextResponse.json({ data: badges });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, badge_type, icon_url } = body;

    if (!name || !description || !badge_type || !icon_url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connect();

    // Auto-generate ID: badge + timestamp (shorter version)
    const autoId = `badge-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

    const newBadge = await Badge.create({
      _id: autoId,
      name,
      description,
      badge_type,
      icon_url
    });

    return NextResponse.json({ success: true, data: newBadge });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json({ error: "Missing Badge ID" }, { status: 400 });
    }

    await connect();
    const updated = await Badge.findByIdAndUpdate(_id, updates, { new: true });

    if (!updated) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await isAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing Badge ID" }, { status: 400 });
    }

    await connect();
    const deleted = await Badge.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Badge not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
