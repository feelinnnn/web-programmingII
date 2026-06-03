import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Temp_auth from "@/models/Temp_auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { email, otpCode } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Bad Request",
          detail: "Missing required fields."
        }]
      }, { status: 400 });
    }

    const tempRecord = await Temp_auth.findOne({
      email,
      otp_code: otpCode,
      purpose: "forgot_password",
    });

    if (!tempRecord) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Unauthorized",
          detail: "Invalid or expired OTP code."
        }]
      }, { status: 400 });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save reset token to Temp_auth for password reset step
    await Temp_auth.deleteMany({ email, purpose: "reset_password" });
    await Temp_auth.create({
      email,
      otp_code: resetToken, 
      purpose: "reset_password",
      createdAt: new Date()
    });

    // Delete the forgot_password OTP record
    await Temp_auth.deleteOne({ _id: tempRecord._id });

    return NextResponse.json({
      data: {
        type: "auth",
        attributes: {
          message: "OTP verified successfully!",
          resetToken: resetToken
        }
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Verify Forgot Password Error:", error);
    return NextResponse.json({
      errors: [{
        status: "500",
        title: "Internal Server Error",
        detail: error.message || "Verification failed."
      }]
    }, { status: 500 });
  }
}
