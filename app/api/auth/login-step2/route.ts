import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Temp_auth from "@/models/Temp_auth";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    console.log("Received Payload:", body);

    const { email, otpCode } = body;

    if (!email || !otpCode) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Bad Request",
          detail: "Missing required fields: email or otpCode"
        }]
      }, { status: 400 });
    }

    const tempRecord = await Temp_auth.findOne({ email, otp_code: otpCode, purpose: "login" });
    
    if (!tempRecord) {
      console.log(`DB Lookup Failed for: Email: ${email}, OTP: ${otpCode}`);
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Unauthorized",
          detail: "Invalid or expired OTP code."
        }]
      }, { status: 400 });
    }

    const otpAge =
    Date.now() -
    new Date(tempRecord.createdAt).getTime();

    const OTP_EXPIRE_TIME = 5 * 60 * 1000;

    if (otpAge > OTP_EXPIRE_TIME) {
      await Temp_auth.deleteOne({
        _id: tempRecord._id,
      });

      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Unauthorized",
          detail: "OTP code has expired."
        }]
      }, { status: 400 });
    }

    const user = await User.findOne({ email: tempRecord.email });
    if (!user) {
      return NextResponse.json({
        errors: [{
          status: "404",
          title: "Not Found",
          detail: "User account not found in database."
        }]
      }, { status: 404 });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "COOKCULT_SECRET_KEY",
      {
        expiresIn: "1d",
      }
    );

    await Temp_auth.deleteOne({ _id: tempRecord._id });

    return NextResponse.json({
      data: {
        type: "auth",
        attributes: {
          message: "Login successful.",
          token
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Login verification error:", error); 
    return NextResponse.json({
      errors: [{
        status: "500",
        title: "Internal Server Error",
        detail: error.message || "Login verification failed."
      }]
    }, { status: 500 });
  }
}