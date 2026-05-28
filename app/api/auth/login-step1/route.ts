import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import { sendOtpEmail } from "@/services/emailservice";
import otpGenerator from "otp-generator";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Please fill in all fields." }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 400 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 400 });
    }

    const otpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false
    });

    await Temp_auth.deleteMany({ email, purpose: "login" });
    await Temp_auth.create({
      email,
      password_hash: user.password, 
      otp_code: otpCode,
      purpose: "login", 
      createdAt: new Date() 
    });

    sendOtpEmail(email, otpCode).catch(err => console.error("Email send failed:", err));

    return NextResponse.json({ message: "Please check your email for the OTP code." }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Login initiation failed.", error }, { status: 500 });
  }
}