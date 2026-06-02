import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { email, otpCode, username } = await request.json();

    // ตรวจสอบข้อมูลที่ส่งมา
    if (!email || !otpCode) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    // ตรวจสอบ OTP
    const tempRecord = await Temp_auth.findOne({
      email,
      otp_code: otpCode,
      purpose: "register",
    });

    if (!tempRecord) {
      return NextResponse.json(
        { message: "Invalid or expired OTP code." },
        { status: 400 }
      );
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

    // ป้องกัน Email ซ้ำ
    const existingUser = await User.findOne({
      email: tempRecord.email,
    });

    if (existingUser) {
      // ลบ OTP ทิ้ง ถ้ามีบัญชีนี้อยู่แล้ว
      await Temp_auth.deleteOne({
        _id: tempRecord._id,
      });

      return NextResponse.json(
        {
          message: "This email is already registered.",
        },
        {
          status: 400,
        }
      );
    }

    // สร้าง User
    const generatedId = new mongoose.Types.ObjectId();

    await User.create({
      _id: generatedId,
      user_id: generatedId.toString(),
      email: tempRecord.email,
      password_hash: tempRecord.password_hash,
      authProvider: "local",
      role: "user",
      display_name:
        username || tempRecord.email.split("@")[0],
    });

    // ลบ OTP หลังสมัครสำเร็จ
    await Temp_auth.deleteOne({
      _id: tempRecord._id,
    });

    return NextResponse.json(
      {
        message: "Account created successfully!",
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error("Verify Register Error:", error);

    return NextResponse.json(
      {
        message: "Verification failed.",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}