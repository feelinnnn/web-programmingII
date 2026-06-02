"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    const hasGoogleSession = (session?.user as any)?.id;
    const hasToken = typeof window !== "undefined" && localStorage.getItem("token");

    if (hasGoogleSession || hasToken) {
      router.replace("/community");
    } else {
      router.replace("/auth-app/register");
    }
  }, [status, session, router]);

  return null;
}
