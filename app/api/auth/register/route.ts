import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import { sendOtpEmail } from "@/services/emailservice";
import {validateEmail,validatePassword,validateUsername} from "@/lib/validation"

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password, username } = await request.json();

    if (!email || !password || !username) {
      return NextResponse.json({ message: "Please fill in all required fields." }, { status: 400 });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ message: emailError }, { status: 400 });
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      return NextResponse.json({ message: usernameError }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "This email is already registered." }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const otpCode = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      specialChars: false, 
      lowerCaseAlphabets: false 
    });

    await Temp_auth.deleteMany({ email, purpose: "register" });
    
    await Temp_auth.create({ 
      email, 
      password_hash: passwordHash,
      otp_code: otpCode, 
      purpose: "register",
      createdAt: new Date()
    });

    await sendOtpEmail(email, otpCode);
    
    return NextResponse.json({ message: "OTP verification code has been sent to your email." }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Registration failed. Please try again.", error }, { status: 500 });
  }
}