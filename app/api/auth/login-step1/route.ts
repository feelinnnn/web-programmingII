import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Temp_auth from "@/models/Temp_auth";
import { sendOtpEmail } from "@/services/emailservice";
import otpGenerator from "otp-generator";
import bcrypt from "bcryptjs";
import { validateEmail } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();

    const email = body.email?.trim();
    const password = body.password?.trim();

    const errors: { [key: string]: string } = {};

    if (!email) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Email format validation
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { errors: { email: emailError } },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { errors: { general: "Invalid email or password." } },
        { status: 400 }
      );
    }

    // Google account
    if (
      user.authProvider === "google" &&
      !user.password_hash
    ) {
      return NextResponse.json(
        {
          errors: { general: "This account uses Google Login. Please sign in with Google." },
        },
        { status: 400 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return NextResponse.json(
        { errors: { general: "Invalid email or password." } },
        { status: 400 }
      );
    }

    // Generate OTP
    const otpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Delete old OTP
    await Temp_auth.deleteMany({
      email,
      purpose: "login",
    });

    // Save new OTP
    await Temp_auth.create({
      email,
      password_hash: user.password_hash,
      otp_code: otpCode,
      purpose: "login",
      createdAt: new Date(),
    });

    // Send email (background)
    sendOtpEmail(email, otpCode).catch((err) =>
      console.error("Email send failed:", err)
    );

    return NextResponse.json(
      {
        message:
          "Please check your email for the OTP code.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login Step 1 Error:", error);

    return NextResponse.json(
      {
        message: "Login initiation failed.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
