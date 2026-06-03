"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';
import styles from "./VerifyOtp.module.css";

function OtpFrom() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email") || "";
    const username = searchParams.get("username") || "";
    const purpose = searchParams.get("purpose") || "register";

    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60); // Countdown timer state

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
            const apiUrl = purpose === "login" ? "/api/auth/login-step2" : "/api/auth/verify-register";

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otpCode, username }),
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
                router.push("/community");
            } else {
                await Swal.fire({
                    icon: 'success',
                    title: 'Account Verified!',
                    text: 'You can now login.',
                    confirmButtonText: 'Go to Login',
                    confirmButtonColor: '#3b1f1f',
                });
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
