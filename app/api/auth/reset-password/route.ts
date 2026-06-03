import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import { validatePassword } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, token, password } = await request.json();

    if (!email || !token || !password) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Bad Request",
          detail: "Missing required fields."
        }]
      }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Validation Error",
          detail: passwordError,
          source: { pointer: "/data/attributes/password" }
        }]
      }, { status: 400 });
    }

    const tempRecord = await Temp_auth.findOne({
      email,
      otp_code: token,
      purpose: "reset_password",
    });

    if (!tempRecord) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Unauthorized",
          detail: "Invalid or expired reset token."
        }]
      }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.updateOne({ email }, { password_hash: passwordHash });

    await Temp_auth.deleteOne({ _id: tempRecord._id });

    return NextResponse.json({
      data: {
        type: "auth",
        attributes: {
          message: "Password reset successfully!"
        }
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json({
      errors: [{
        status: "500",
        title: "Internal Server Error",
        detail: error.message || "Failed to reset password. Please try again."
      }]
    }, { status: 500 });
  }
}
