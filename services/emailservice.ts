import nodemailer from 'nodemailer';

if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Missing email configuration");
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },   
});

export const sendOtpEmail = async (
    email: string,
    otpCode: string
): Promise<void> => {
    try { 
        const emailBody = {
            from: `"CookCult System" <${process.env.MAIL_USER}>`,
            to: email,
            subject: `Your OTP Verification Code: ${otpCode}`,
            html: `
                <h2>CookCult Verification</h2>
                <p>Welcome to CookCult!</p>
                <p>Your verification code:</p>
                <h1>${otpCode}</h1>
                <p>This code expires in 5 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            ` 
        };  
        await transporter.sendMail(emailBody);

    }   catch (error) {
            console.error("Failed to send OTP email:", error);
            throw new Error("Email sending failed");
    }
};