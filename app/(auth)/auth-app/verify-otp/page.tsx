"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from 'sweetalert2'; // 1. Import SweetAlert2
import styles from "./VerifyOtp.module.css";

function OtpFrom() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email") || "";
    const username = searchParams.get("username") || "";
    const purpose = searchParams.get("purpose") || "register";

    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);


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

            const swalConfig = {
                confirmButtonColor: '#3b1f1f', 
                buttonsStyling: true,
            };

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
                    confirmButtonText: 'Go to Login'
                });
                router.push("/auth-app/login");
            }
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Verification Failed',
                text: err.message || 'Something went wrong',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
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
                timer: 2000
            });
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message });
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
                    />
                    <button type="submit" disabled={loading || otpCode.length < 6} className={styles.submitBtn}>
                        {loading ? "Checking..." : "Verify OTP"}
                    </button>
                </form>

                <div className={styles.resendWrap}>
                    <button type="button" className={styles.resendBtn} onClick={handleResend} disabled={loading}>
                        Resend
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
