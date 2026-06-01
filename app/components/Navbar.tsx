"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./Navbar.css";

export default function Navbar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string;
    profile_image_url: string;
    role: string;
  } | null>(null);

  useEffect(() => {
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
        });
      } catch {
        // Silently fail — user may not be logged in
      }
    };

    fetchProfile();
  }, []);

  const displayName = profile?.display_name || "Guest";
  const avatarSrc = profile?.profile_image_url || "/avatar/Avatar.png";
  const roleLabel = profile?.role === "admin" ? "Admin" : "Home Cook";

  return (
    <nav className={`navbar ${isExpanded ? "expanded" : "collapsed"}`}>
      <div className="logo-container">
        {isExpanded ? (
          <img src="/logo/cookcult-logo.png" alt="Logo" className="logo-full" />
        ) : (
          <p className="logo-c">C</p>
        )}
        <img
          src="/picture-navbar/hidemenu.png"
          alt="Toggle Menu"
          className="hidemenu"
          onClick={() => setIsExpanded(!isExpanded)}
        />
      </div>

      {isExpanded && <div className="line"></div>}

      <div className="menu-items">
        {isExpanded && <div className="menu-header">Main Menu</div>}

        <Link href="/" className="menu-item">
          <img src="/picture-navbar/home.png" alt="Home" className="pic" />
          {isExpanded && <span className="menu-text">Home</span>}
        </Link>
        <Link href="/lessons" className="menu-item">
          <img src="/picture-navbar/lesson.png" alt="Lessons" className="pic" />
          {isExpanded && <span className="menu-text">Lessons</span>}
        </Link>
        <Link href="/history" className="menu-item">
          <img src="/picture-navbar/history.png" alt="History" className="pic" />
          {isExpanded && <span className="menu-text">History</span>}
        </Link>
        <Link href="/bookmark" className="menu-item">
          <img src="/picture-navbar/bookmark.png" alt="Bookmark" className="pic" />
          {isExpanded && <span className="menu-text">Bookmark</span>}
        </Link>
      </div>

      <Link
        href="/profile"
        className={`profile-bottom-card ${isExpanded ? "expanded" : "collapsed"}`}
      >
        <img
          src={avatarSrc}
          alt="Profile"
          className="profile-pic-bottom"
        />

        {isExpanded && (
          <>
            <div className="profile-info">
              <span className="profile-name">{displayName}</span>
              <span className="profile-role">{roleLabel}</span>
            </div>
            <div className="logout-icon">
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
