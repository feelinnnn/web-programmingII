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

    const tempRecord = await Temp_auth.findOne({ email }).sort({ createdAt: -1 });

    if (!tempRecord) {
      return NextResponse.json(
        { message: "Session not found. Please restart the registration or login process." },
        { status: 400 }
      );
    }
    const diff = Date.now() - new Date(tempRecord.createdAt).getTime();

    if (diff < 60 * 1000) {
      const remainSeconds =
        Math.ceil((60 * 1000 - diff) / 1000);

      return NextResponse.json(
        { message: `Please wait ${remainSeconds} seconds before requesting another OTP.`, },
        { status: 429, });
    }

    const newOtpCode = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false,
    });

    tempRecord.otp_code = newOtpCode;
    if ((tempRecord as any).createdAt) {
      (tempRecord as any).createdAt = new Date();
    }
    await tempRecord.save();

    await sendOtpEmail(email, newOtpCode);

    return NextResponse.json({ message: "A new OTP code has been successfully sent to your email." }, { status: 200 });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json({ message: "Failed to resend OTP.", error }, { status: 500 });
  }
}