import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import otpGenerator from "otp-generator";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import { sendOtpEmail } from "@/services/emailservice";
import { validateEmail, validatePassword, validateUsername } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password, username } = await request.json();

    const errors: { [key: string]: string } = {};

    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    if (!username) errors.username = "Username is required.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({
        errors: Object.entries(errors).map(([field, detail]) => ({
          status: "400",
          title: "Validation Error",
          detail,
          source: { pointer: `/data/attributes/${field}` }
        }))
      }, { status: 400 });
    }

    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    const usernameError = validateUsername(username);
    if (usernameError) errors.username = usernameError;

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({
        errors: Object.entries(errors).map(([field, detail]) => ({
          status: "400",
          title: "Validation Error",
          detail,
          source: { pointer: `/data/attributes/${field}` }
        }))
      }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Conflict",
          detail: "This email is already registered.",
          source: { pointer: "/data/attributes/email" }
        }]
      }, { status: 400 });
    }

    const existingUsername = await User.findOne({ display_name: username });
    if (existingUsername) {
      return NextResponse.json({
        errors: [{
          status: "400",
          title: "Conflict",
          detail: "This username is already taken.",
          source: { pointer: "/data/attributes/username" }
        }]
      }, { status: 400 });
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
      username,
      otp_code: otpCode, 
      purpose: "register",
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
    console.error("Registration error:", error);
    return NextResponse.json({
      errors: [{
        status: "500",
        title: "Internal Server Error",
        detail: error.message || "Registration failed. Please try again."
      }]
    }, { status: 500 });
  }
}
