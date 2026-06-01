"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import EditProfileModal from "../../components/profile/EditProfileModal";
import ViewProfileModal from "../../components/profile/ViewProfileModal";
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
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const fetchProfile = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="layout-container">
        <main className="main-content" style={{ padding: "2rem" }}>
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="layout-container">
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

      <main className="main-content">
        <header className="profile-header">
          <div className="profile-info-top">
            <div className="profile-user-left">
              <Image
                src={(attributes.profile_image_url || "/avatar/Avatar.png").replace(
                  /=s\d+-c/,
                  "=s400"
                )}
                alt={attributes.display_name || "User"}
                width={110}
                height={110}
                className="large-avatar"
              />
              <div className="user-details">
                <h1>{attributes.display_name || "Cook"}</h1>
                <p className="subtitle">
                  {attributes.role === "admin" ? "Admin" : "Home cook"}
                  <span className="social-icons">
                    {attributes.social_links?.instagram && (
                      <a href={attributes.social_links.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                          <circle cx="12" cy="12" r="5"/>
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="3"/>
                        </svg>
                      </a>
                    )}
                    {attributes.social_links?.facebook && (
                      <a href={attributes.social_links.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                        </svg>
                      </a>
                    )}
                    {attributes.social_links?.twitter && (
                      <a href={attributes.social_links.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                    {attributes.social_links?.tiktok && (
                      <a href={attributes.social_links.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                        </svg>
                      </a>
                    )}
                    {attributes.social_links?.youtube && (
                      <a href={attributes.social_links.youtube} target="_blank" rel="noopener noreferrer" title="YouTube">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                      </a>
                    )}
                    {attributes.email && (
                      <span onClick={() => { navigator.clipboard.writeText(attributes.email); alert("Email copied: " + attributes.email); }} title="Copy email" style={{ cursor: "pointer" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </span>
                    )}
                    <span onClick={() => setShowViewModal(true)} title="View profile card" style={{ cursor: "pointer" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="19" cy="12" r="1"/>
                        <circle cx="5" cy="12" r="1"/>
                      </svg>
                    </span>
                  </span>
                </p>
              </div>
            </div>
            <button className="edit-btn" onClick={() => setShowModal(true)}>Edit profile</button>
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

      {showModal && (
        <EditProfileModal
          initialData={{
            email: attributes.email,
            display_name: attributes.display_name,
            bio: attributes.bio,
            profile_image_url: attributes.profile_image_url,
            social_links: attributes.social_links,
          }}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchProfile();
          }}
        />
      )}

      {showViewModal && (
        <ViewProfileModal
          profile={{
            display_name: attributes.display_name,
            email: attributes.email,
            bio: attributes.bio,
            profile_image_url: attributes.profile_image_url,
            role: attributes.role,
            social_links: attributes.social_links,
          }}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
}
