import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import UserBadge from "@/models/UserBadge";

// PATCH /api/user-badges/[id]/cancel — cancel certification request, back to non-request
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connect();
    const badge = await UserBadge.findByIdAndUpdate(
      id,
      { $set: { status: "non-request", certificationRequested: false } },
      { new: true }
    );
    if (!badge) {
      return NextResponse.json({ errors: [{ detail: "Not found" }] }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ errors: [{ detail: error.message }] }, { status: 500 });
  }
}
