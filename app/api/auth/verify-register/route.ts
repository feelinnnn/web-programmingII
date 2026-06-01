import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import mongoose from "mongoose"; 

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, otpCode, username } = await request.json();

    if (!email || !otpCode) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    const tempRecord = await Temp_auth.findOne({ email, otp_code: otpCode, purpose: "register" });
    if (!tempRecord) {
      return NextResponse.json({ message: "Invalid or expired OTP code." }, { status: 400 });
    }

    const generatedId = new mongoose.Types.ObjectId();

    await User.create({
      _id: generatedId,
      user_id: generatedId.toString(),
      email: tempRecord.email,
      password_hash: tempRecord.password_hash,
      authProvider: "local",
      role: "user",
      display_name: username || tempRecord.email.split("@")[0],
    });

    await Temp_auth.deleteOne({ _id: tempRecord._id });

    return NextResponse.json({ message: "Account created successfully!" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Verification failed.", error }, { status: 500 });
  }
}