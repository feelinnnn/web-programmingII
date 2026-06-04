import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import UserBadge from "@/models/UserBadge";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connect();
    const body = await req.json();
    const updates: any = {};
    if (body.evidenceUrls !== undefined) updates.evidenceUrls = body.evidenceUrls;
    if (body.userNote !== undefined) updates.userNote = body.userNote;
    if (body.resubmit === true) {
      updates.status = "non-request";
      updates.adminComment = null;
    }
    await UserBadge.findByIdAndUpdate(id, { $set: updates });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ errors: [{ detail: error.message }] }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connect();
    await UserBadge.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ errors: [{ detail: error.message }] }, { status: 500 });
  }
}
