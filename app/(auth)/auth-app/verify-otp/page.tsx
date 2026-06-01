"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./VerifyOtp.module.css";

function OtpFrom() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const email = searchParams.get("email") || "";
    const username = searchParams.get("username") || "";
    const purpose = searchParams.get("purpose") || "register";

    const [otpCode, setOtpCode] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            setError("Email data missing. Please do the process again.");
        }
    }, [email]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const apiUrl =
                purpose === "login"
                    ? "/api/auth/login-step2"
                    : "/api/auth/verify-register";

            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otpCode, username }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Invalid or expired OTP");

            if (purpose === "login") {
                setMessage("2FA Login successful!");
                localStorage.setItem("token", data.token);
                setTimeout(() => router.push("/community"), 1000);
            } else {
                setMessage("Account verified! Redirecting to login page...");
                setTimeout(() => router.push("/auth-app/login"), 2000);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setError("");
        setMessage("");
        try {
            const res = await fetch("/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to resend OTP");
            setMessage("A new OTP has been sent to your email.");
        } catch (err: any) {
            setError(err.message);
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

                {error && <div className={styles.errorBlock}>⚠️ {error}</div>}
                {message && <div className={styles.successBlock}>✅ {message}</div>}

                <form onSubmit={handleVerify} className={styles.form}>
                    <input
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        disabled={!email || loading}
                        required
                        className={styles.inputOtp}
                    />
                    <button
                        type="submit"
                        disabled={!email || loading || otpCode.length < 6}
                        className={styles.submitBtn}
                    >
                        {loading ? "Checking..." : "Verify OTP"}
                    </button>
                </form>

                <div className={styles.resendWrap}>
                    Didn&apos;t receive a code?{" "}
                    <button
                        type="button"
                        className={styles.resendBtn}
                        onClick={handleResend}
                        disabled={!email || loading}
                    >
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
