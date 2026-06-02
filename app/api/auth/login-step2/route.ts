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
      return NextResponse.json({ message: "Missing required fields: email or otpCode" }, { status: 400 });
    }

    const tempRecord = await Temp_auth.findOne({ email, otp_code: otpCode, purpose: "login" });
    
    if (!tempRecord) {
      console.log(`DB Lookup Failed for: Email: ${email}, OTP: ${otpCode}`);
      return NextResponse.json({ message: "Invalid or expired OTP code." }, { status: 400 });
    }

    const otpAge =
    Date.now() -
    new Date(tempRecord.createdAt).getTime();

    const OTP_EXPIRE_TIME = 5 * 60 * 1000;

    if (otpAge > OTP_EXPIRE_TIME) {
      await Temp_auth.deleteOne({
        _id: tempRecord._id,
      });

      return NextResponse.json(
        {
          message: "OTP code has expired.",
        },
        {
          status: 400,
        }
      );
    }

      const user = await User.findOne({ email: tempRecord.email });
      if (!user) {
          return NextResponse.json({ message: "User account not found in database." }, { status: 404 });
        }

        if (!user) {
      await Temp_auth.deleteOne({
        _id: tempRecord._id,
      });

      return NextResponse.json(
        {
          message: "User account not found in database."
        },
        {
          status: 404
        }
      );
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        user_id: user.user_id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || process.env.JWT_SECRET ,
      {
        expiresIn: "1d",
      }
    );

    await Temp_auth.deleteOne({ _id: tempRecord._id });

    return NextResponse.json({ 
      message: "Login successful.", 
      token 
    }, { status: 200 });

  } catch (error) {
    console.error("Login verification error:", error); 
    return NextResponse.json({ message: "Login verification failed.", error }, { status: 500 });
  }
}