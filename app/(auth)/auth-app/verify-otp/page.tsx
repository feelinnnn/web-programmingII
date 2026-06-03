"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';
import styles from "./VerifyOtp.module.css";

function OtpFrom() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [purpose, setPurpose] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // Countdown timer state

    useEffect(() => {
        // Try to get from sessionStorage first
        const storedEmail = sessionStorage.getItem("auth_email");
        const storedPurpose = sessionStorage.getItem("auth_purpose");

        if (storedEmail) {
            setEmail(storedEmail);
        } else {
            // Fallback to searchParams if needed (optional)
            setEmail(searchParams.get("email") || "");
        }

        if (storedPurpose) {
            setPurpose(storedPurpose);
        } else {
            setPurpose(searchParams.get("purpose") || "register");
        }
    }, [searchParams]);

    // Countdown effect
    useEffect(() => {
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);

        try {
            let apiUrl = "";
            if (purpose === "login") apiUrl = "/api/auth/login-step2";
            else if (purpose === "register") apiUrl = "/api/auth/verify-register";
            else if (purpose === "forgot_password") apiUrl = "/api/auth/verify-forgot-password";

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otpCode }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Invalid or expired OTP");

            if (purpose === "login") {
                await Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: 'Redirecting to community...',
                    timer: 1500,
                    showConfirmButton: false,
                });
                localStorage.setItem("token", data.token);
                // Clean up sessionStorage
                sessionStorage.removeItem("auth_email");
                sessionStorage.removeItem("auth_purpose");
                router.push("/community");
            } else if (purpose === "forgot_password") {
                await Swal.fire({
                    icon: 'success',
                    title: 'OTP Verified!',
                    text: 'Please set your new password.',
                    timer: 1500,
                    showConfirmButton: false,
                });
                sessionStorage.setItem("auth_email", email);
                sessionStorage.setItem("auth_token", data.resetToken);
                router.push("/auth-app/reset-password");
            } else {
                await Swal.fire({
                    icon: 'success',
                    title: 'Account Verified!',
                    text: 'You can now login.',
                    confirmButtonText: 'Go to Login',
                    confirmButtonColor: '#3b1f1f',
                });
                // Clean up sessionStorage
                sessionStorage.removeItem("auth_email");
                sessionStorage.removeItem("auth_purpose");
                router.push("/auth-app/login");
            }
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: err.message || 'Something went wrong',
                confirmButtonColor: '#3b1f1f',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0) return; // Prevent resend if timer is active

        setLoading(true);
        try {
            const res = await fetch("/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            Swal.fire({
                icon: 'success',
                title: 'Resent!',
                text: 'A new OTP has been sent to your email.',
                timer: 2000,
                showConfirmButton: false,
            });
            setTimeLeft(60); // Reset timer to 60 seconds
        } catch (err: any) {
            Swal.fire({ 
                icon: 'error', 
                title: 'Error', 
                text: err.message,
                confirmButtonColor: '#3b1f1f',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>OTP Verification</h2>
                <p className={styles.description}>
                    We&apos;ve sent a 6-digit code to <br />
                    <strong>{email || "your email"}</strong>
                </p>


                <form onSubmit={handleVerify} className={styles.form}>
                    <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        disabled={loading}
                        required
                        className={styles.inputOtp}
                        placeholder="000000"
                    />
                    <button type="submit" disabled={loading || otpCode.length < 6} className={styles.submitBtn}>
                        {loading ? "Checking..." : "Verify OTP"}
                    </button>
                </form>

                <div className={styles.resendWrap}>
                    <span>Didn&apos;t receive the code? </span>
                    <button 
                        type="button" 
                        className={styles.resendBtn} 
                        onClick={handleResend} 
                        disabled={loading || timeLeft > 0}
                    >
                        Resend {timeLeft > 0 && `(${timeLeft}s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense
            fallback={
                <div style={{ textAlign: "center", marginTop: "100px" }}>
                    Loading...
                </div>
            }
        >
            <OtpFrom />
        </Suspense>
    );
}
