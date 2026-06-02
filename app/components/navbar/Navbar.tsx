"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import "./Navbar.css";

export default function Navbar() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string;
    profile_image_url: string;
    role: string;
    sub_namebio: string;
  } | null>(null);

  // Load saved navbar state after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("navbar-expanded");
    if (saved === "true") setIsExpanded(true);
    setMounted(true);
  }, []);

  const toggleNavbar = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem("navbar-expanded", String(next));
  };

  const fetchProfile = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/vnd.api+json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/profile", { headers });
      if (!res.ok) return;

      const json = await res.json();
      setProfile({
        display_name: json.data.attributes.display_name,
        profile_image_url: json.data.attributes.profile_image_url,
        role: json.data.attributes.role,
        sub_namebio: json.data.attributes.sub_namebio || "",
      });
    } catch {
      // Silently fail — user may not be logged in
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Re-fetch profile when edit is saved elsewhere
  useEffect(() => {
    const handleProfileUpdated = () => {
      fetchProfile();
    };
    window.addEventListener("profile-updated", handleProfileUpdated);
    return () => window.removeEventListener("profile-updated", handleProfileUpdated);
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setProfile(null);
    router.push("/auth-app/register");
  };

  const fixImageUrl = (url: string) => url.replace(/=s\d+-c/, "=s400");

  const expanded = mounted && isExpanded;

  const displayName = profile?.display_name || "Guest";
  const avatarSrc = fixImageUrl(profile?.profile_image_url || "/avatar/Avatar.png");
  const roleLabel = profile?.sub_namebio || (profile?.role === "admin" ? "Admin" : "Home Cook");

  return (
    <nav className={`navbar ${expanded ? "expanded" : "collapsed"}`}>
      <div className="logo-container">
        {expanded ? (
          <Link href="/community"><img src="/logo/cookcult-logo.png" alt="Logo" className="logo-full" /></Link>
        ) : (
          <Link href="/community"><p className="logo-c">C</p></Link>
        )}
        <img
          src="/picture-navbar/hidemenu.png"
          alt="Toggle Menu"
          className="hidemenu"
          onClick={toggleNavbar}
        />
      </div>

      {expanded && <div className="line"></div>}

      <div className="menu-items">
        {expanded && <div className="menu-header">Main Menu</div>}

        <Link href="/community" className="menu-item">
          <svg className="pic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {expanded && <span className="menu-text">Home</span>}
        </Link>
        <Link href="/lesson_main" className="menu-item">
          <svg className="pic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {expanded && <span className="menu-text">Lessons</span>}
        </Link>
        <Link href="/badge-status" className="menu-item">
          <svg className="pic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {expanded && <span className="menu-text">Badge Status</span>}
        </Link>
        <Link href="/bookmark" className="menu-item">
          <svg className="pic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          {expanded && <span className="menu-text">Bookmark</span>}
        </Link>
      </div>

      <Link
        href="/profile"
        className={`profile-bottom-card ${expanded ? "expanded" : "collapsed"}`}
      >
        <Image
          src={avatarSrc}
          alt="Profile"
          width={40}
          height={40}
          className="profile-pic-bottom"
        />

        {expanded && (
          <>
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">{roleLabel}</span>
            </div>
            <div className="logout-icon" onClick={handleLogout} title="Logout">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
          </>
        )}
      </Link>
    </nav>
  );
}
