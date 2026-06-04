import { NextRequest, NextResponse } from "next/server";
import connect from "@/lib/mongodb";
import UserBadge from "@/models/UserBadge";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await connect();

    // Find this badge first to get userId
    const thisBadge = await UserBadge.findById(id).lean();
    if (!thisBadge) {
      return NextResponse.json({ errors: [{ detail: "Badge not found" }] }, { status: 404 });
    }

    // Check: user can only have ONE pending certification at a time
    const existingPending = await UserBadge.findOne({
      userId: thisBadge.userId,
      status: "pending",
      _id: { $ne: id }
    });

    if (existingPending) {
      return NextResponse.json(
        { errors: [{ detail: "You already have a pending certification request. Cancel it first before requesting a new one." }] },
        { status: 409 }
      );
    }

    // Check: if already expert-certified+verified, block
    const existingVerified = await UserBadge.findOne({
      userId: thisBadge.userId,
      badgeTypeSnapshot: "expert-certified",
      status: "verified",
      _id: { $ne: id }
    });

    if (existingVerified) {
      return NextResponse.json(
        { errors: [{ detail: "You already have an Expert Certified badge. Only one is allowed." }] },
        { status: 409 }
      );
    }

    const badge = await UserBadge.findByIdAndUpdate(
      id,
      { $set: { certificationRequested: true, status: "pending", submittedAt: new Date() } },
      { new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ errors: [{ detail: error.message }] }, { status: 500 });
  }
}
