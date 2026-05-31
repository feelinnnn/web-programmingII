import { useSession } from "next-auth/react";
import { jwtDecode } from "jwt-decode";

export function GetUserid() {

    // Google
    const { data: session } = useSession();

    const currentSession: any = session;
    if (currentSession?.user?.id) {
        return currentSession.user.id;
    }

    // Gmail + OTP
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                return decoded.id;
            } catch (err) {
                console.error("Invalid token format");
            }
        }
    }

    return null; //ยังไม่ได้ล็อกอิน
}