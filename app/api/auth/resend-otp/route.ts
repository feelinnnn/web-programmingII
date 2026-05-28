import { NextResponse } from "next/server";
import otpGenerator from "otp-generator";
import dbConnect from "@/lib/mongodb";
import Temp_auth from "@/models/Temp_auth";
import { sendOtpEmail } from "@/services/emailservice";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const tempRecord = await Temp_auth.findOne({ email }).sort({ created_at: -1 });

    if (!tempRecord) {
      return NextResponse.json(
        { message: "Session not found. Please restart the registration or login process." },
        { status: 400 }
      );
    }

    const newOtpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    tempRecord.otp_code = newOtpCode;
    if ((tempRecord as any).created_at) {
      (tempRecord as any).created_at = new Date();
    }
    await tempRecord.save();

    await sendOtpEmail(email, newOtpCode);

    return NextResponse.json({ message: "A new OTP code has been successfully sent to your email." }, { status: 200 });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json({ message: "Failed to resend OTP.", error }, { status: 500 });
  }
}