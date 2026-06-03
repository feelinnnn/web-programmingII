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
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Bad Request",
          detail: "Email is required.",
          source: { pointer: "/data/attributes/email" }
        }]
      }, { status: 400 });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Validation Error",
          detail: emailError,
          source: { pointer: "/data/attributes/email" }
        }]
      }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        errors: [{
          status: "404",
          title: "Not Found",
          detail: "No account found with this email.",
          source: { pointer: "/data/attributes/email" }
        }]
      }, { status: 404 });
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
    
    return NextResponse.json({
      data: {
        type: "auth",
        attributes: {
          message: "OTP verification code has been sent to your email."
        }
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json({
      errors: [{
        status: "500",
        title: "Internal Server Error",
        detail: error.message || "Failed to send OTP. Please try again."
      }]
    }, { status: 500 });
  }
}
