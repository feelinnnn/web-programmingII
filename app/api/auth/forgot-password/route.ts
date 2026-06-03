import { NextResponse } from "next/server";
import otpGenerator from "otp-generator";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import { sendOtpEmail } from "@/services/emailservice";
import { validateEmail } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ message: emailError }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "No account found with this email." }, { status: 404 });
    }

    const otpCode = otpGenerator.generate(6, { 
      upperCaseAlphabets: false, 
      specialChars: false, 
      lowerCaseAlphabets: false 
    });

    await Temp_auth.deleteMany({ email, purpose: "forgot_password" });
    
    await Temp_auth.create({ 
      email, 
      otp_code: otpCode, 
      purpose: "forgot_password",
      createdAt: new Date()
    });
    
    await sendOtpEmail(email, otpCode);
    
    return NextResponse.json({ message: "OTP verification code has been sent to your email." }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Failed to send OTP. Please try again." }, { status: 500 });
  }
}
