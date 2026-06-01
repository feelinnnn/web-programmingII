"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./profile.css";

interface UserProfile {
  id: string;
  attributes: {
    display_name: string;
    email: string;
    profile_image_url: string;
    bio: string;
    role: string;
    social_links: {
      instagram: string;
      facebook: string;
      twitter: string;
      tiktok: string;
      youtube: string;
    };
    created_at: string;
  };
  relationships: {
    stats: { data: any };
    badges: { data: any[] };
    progress: { data: { lessons_started: number; total_completed_chapters: number } };
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        if (!res.ok) {
          if (res.status === 401) {
            setError("Please log in to view your profile.");
            return;
          }
          throw new Error(`Failed to fetch profile (${res.status})`);
        }

        const json = await res.json();
        setProfile(json.data);
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="layout-container">
        <Navbar />
        <main className="main-content" style={{ padding: "2rem" }}>
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="layout-container">
        <Navbar />
        <main className="main-content" style={{ padding: "2rem" }}>
          <p>{error || "Profile not found"}</p>
        </main>
      </div>
    );
  }

  const { attributes, relationships } = profile;
  const stats = relationships?.stats?.data;
  const badges = relationships?.badges?.data || [];
  const progress = relationships?.progress?.data;

  // Count badges by status
  const verifiedBadges = badges.filter((b: any) => b.attributes?.status === "verified");
  const pendingBadges = badges.filter((b: any) => b.attributes?.status === "pending");

  return (
    <div className="layout-container">
      <Navbar />

      <main className="main-content">
        <header className="profile-header">
          <div className="profile-info-top">
            <div className="profile-user-left">
              <img
                src={attributes.profile_image_url || "/avatar/Avatar.png"}
                alt={attributes.display_name || "User"}
                className="large-avatar"
              />
              <div className="user-details">
                <h1>{attributes.display_name || "Cook"}</h1>
                <p className="subtitle">
                  {attributes.role === "admin" ? "Admin" : "Home cook"}
                  <span className="social-icons">
                    {attributes.social_links?.instagram && (
                      <span><img src="/icon/instragram-icon.png" alt="instagram" /></span>
                    )}
                    {attributes.social_links?.facebook && (
                      <span><img src="/icon/facebook-icon.png" alt="facebook" /></span>
                    )}
                    {attributes.social_links?.twitter && (
                      <span><img src="/icon/x-icon.png" alt="x" /></span>
                    )}
                    {attributes.email && (
                      <span><img src="/icon/email-icon.png" alt="email" /></span>
                    )}
                  </span>
                </p>
              </div>
            </div>
            <button className="edit-btn">Edit profile</button>
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <strong>{stats?.total_badges_verified ?? 0}</strong>
              <span>Badges Verified</span>
            </div>
            <div className="stat-box">
              <strong>{stats?.total_self_declared_count ?? 0}</strong>
              <span>Self Declared</span>
            </div>
            <div className="stat-box">
              <strong>{stats?.total_evidence_backed_count ?? 0}</strong>
              <span>Evidence Backed</span>
            </div>
            <div className="stat-box">
              <strong>{stats?.total_expert_certified_count ?? 0}</strong>
              <span>Expert Certified</span>
            </div>
            <div className="stat-box">
              <strong>{progress?.lessons_started ?? 0}</strong>
              <span>Lessons Started</span>
            </div>
          </div>
        </header>

        <section className="showcase-section">
          <div className="showcase-controls">
            <div className="left-controls">
              <h2 className="showcase-title">Showcase</h2>
              <div className="toggle-group">
                <button className="active">All</button>
                <button>Select</button>
              </div>
            </div>
            <div className="right-controls">
              <button className="select-showcase-btn">Select Showcase</button>
              <button className="add-btn">+ Add</button>
            </div>
          </div>

          <div className="filter-tags">
            <span className="tag tag-all">
              All <span className="count">{badges.length}</span>
            </span>
            <span className="tag tag-green">
              Verified <span className="count">{verifiedBadges.length}</span>
            </span>
            <span className="tag tag-orange">
              Pending <span className="count">{pendingBadges.length}</span>
            </span>
          </div>

          <div className="card-grid">
            {badges.length === 0 && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                No badges yet. Complete lessons to earn badges!
              </p>
            )}
            {badges.map((userBadge: any, i: number) => {
              const badge = userBadge.relationships?.badge?.data;
              return (
                <div key={userBadge.id || i} className="card">
                  <div className="card-image-area">
                    <span className="card-badge">
                      {badge?.attributes?.name || "Badge"}
                    </span>
                  </div>
                  <div className="card-footer">
                    {badge?.attributes?.name || "Unknown"}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
