import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Temp_auth from "@/models/Temp_auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { email, otpCode } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const tempRecord = await Temp_auth.findOne({
      email,
      otp_code: otpCode,
      purpose: "forgot_password",
    });

    if (!tempRecord) {
      return NextResponse.json(
        { message: "Invalid or expired OTP code." },
        { status: 400 }
      );
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save reset token to Temp_auth for password reset step
    await Temp_auth.deleteMany({ email, purpose: "reset_password" });
    await Temp_auth.create({
      email,
      otp_code: resetToken, // We'll reuse otp_code field to store token or add a new field. 
      // Actually, let's reuse otp_code for simplicity in this prototype or add token field.
      // Since I already have otp_code as String, it works.
      purpose: "reset_password",
      createdAt: new Date()
    });

    // Delete the forgot_password OTP record
    await Temp_auth.deleteOne({ _id: tempRecord._id });

    return NextResponse.json(
      {
        message: "OTP verified successfully!",
        resetToken: resetToken
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Verify Forgot Password Error:", error);
    return NextResponse.json(
      { message: "Verification failed.", error: error.message },
      { status: 500 }
    );
  }
}
