"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import "../profile/profile.css";
import BadgeInfoModal from "../../components/profile/BadgeInfoModal";

interface UserData {
  id: string;
  attributes: {
    display_name: string;
    sub_namebio: string;
    bio: string;
    profile_image_url: string;
    role: string;
    social_links: {
      instagram: string;
      facebook: string;
      twitter: string;
      tiktok: string;
      youtube: string;
    };
  };
  relationships: {
    stats: { data: any };
    badges: { data: any[] };
  };
}

function getBadgeColor(b: any): string {
  const type = b.attributes?.badge_type_snapshot || "";
  if (type === "self-declared") return "#A0D585";
  if (type === "evidence-backed") return "#FFA95A";
  if (type === "expert-certified") return "#FF5A5A";
  if (type === "lesson") return "#FFD45A";
  return "#A0D585";
}

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showcase, setShowcase] = useState<Set<string>>(new Set());
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((json) => {
        setUser(json.data);
        // Load showcase from user data if available
        const ids = json.data?.relationships?.showcase || [];
        setShowcase(new Set(ids.map((s: any) => s.id || s)));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return <div className="layout-container"><main className="main-content" style={{ padding: "2rem" }}><p>No user specified.</p></main></div>;
  if (loading) return <div className="layout-container"><main className="main-content" style={{ padding: "2rem" }}><p>Loading...</p></main></div>;
  if (!user) return <div className="layout-container"><main className="main-content" style={{ padding: "2rem" }}><p>User not found.</p></main></div>;

  const { attributes, relationships } = user;
  const stats = relationships?.stats?.data;
  const badges = relationships?.badges?.data || [];

  // Only show showcased badges, or all verified if no showcase set
  const displayBadges = showcase.size > 0
    ? badges.filter((b: any) => showcase.has(b.id))
    : badges;

  const colorCounts: Record<string, number> = {};
  displayBadges.forEach((b: any) => {
    const c = getBadgeColor(b);
    colorCounts[c] = (colorCounts[c] || 0) + 1;
  });

  const filteredBadges = displayBadges.filter((b: any) => {
    if (!search.trim() && !colorFilter) return true;
    if (search.trim()) {
      const name = b.relationships?.badge?.data?.attributes?.name || "";
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (colorFilter && getBadgeColor(b) !== colorFilter) return false;
    return true;
  });

  return (
    <div className="layout-container">
      <main className="main-content">
        <header className="profile-header">
          <div className="profile-info-top">
            <div className="profile-user-left">
              <Image
                src={(attributes.profile_image_url || "/avatar/Avatar.png").replace(/=s\d+-c/, "=s400")}
                alt={attributes.display_name || "User"}
                width={110}
                height={110}
                className="large-avatar"
              />
              <div className="user-details">
                <h1>{attributes.display_name || "Cook"}</h1>
                <p className="subtitle">
                  {attributes.sub_namebio || (attributes.role === "admin" ? "Admin" : "Home cook")}
                  {attributes.social_links && (
                    <span className="social-icons">
                      {attributes.social_links.instagram && (
                        <a href={attributes.social_links.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/></svg>
                        </a>
                      )}
                      {attributes.social_links.facebook && (
                        <a href={attributes.social_links.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        </a>
                      )}
                      {attributes.social_links.twitter && (
                        <a href={attributes.social_links.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
                        </a>
                      )}
                      {attributes.social_links.tiktok && (
                        <a href={attributes.social_links.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
                        </a>
                      )}
                      {attributes.social_links.youtube && (
                        <a href={attributes.social_links.youtube} target="_blank" rel="noopener noreferrer" title="YouTube">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816z"/></svg>
                        </a>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </div>
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
              <strong>{badges.length}</strong>
              <span>Total Badges</span>
            </div>
          </div>
        </header>

        <section className="showcase-section">
          <h2 className="showcase-title">Showcase</h2>

          <div className="showcase-search">
            <input
              className="search-input"
              type="text"
              placeholder="Search badges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tags">
            <span
              className={`tag tag-all ${!colorFilter ? "active" : ""}`}
              onClick={() => setColorFilter(null)}
            >
              All <span className="count">{displayBadges.length}</span>
            </span>
            <span
              className={`tag tag-green ${colorFilter === "#A0D585" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#A0D585" ? null : "#A0D585")}
            >
              Badge <span className="count">{colorCounts["#A0D585"] || 0}</span>
            </span>
            <span
              className={`tag tag-red ${colorFilter === "#FF5A5A" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#FF5A5A" ? null : "#FF5A5A")}
            >
              Badge <span className="count">{colorCounts["#FF5A5A"] || 0}</span>
            </span>
            <span
              className={`tag tag-orange ${colorFilter === "#FFA95A" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#FFA95A" ? null : "#FFA95A")}
            >
              Badge <span className="count">{colorCounts["#FFA95A"] || 0}</span>
            </span>
            <span
              className={`tag tag-yellow ${colorFilter === "#FFD45A" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#FFD45A" ? null : "#FFD45A")}
            >
              Badge <span className="count">{colorCounts["#FFD45A"] || 0}</span>
            </span>
            <img src="/icon/giveinfo.svg" className="filter-info-btn" alt="info" onClick={() => setShowInfo(true)} />
          </div>

          <div className="card-grid">
            {filteredBadges.length === 0 && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>No badges found.</p>
            )}
            {filteredBadges.map((b: any, i: number) => {
              const badge = b.relationships?.badge?.data;
              const color = getBadgeColor(b);
              return (
                <div key={b.id || i} className="card">
                  <div className="card-image-area">
                    {badge?.attributes?.icon_url ? (
                      <img
                        src={badge.attributes.icon_url}
                        alt={badge?.attributes?.name || "Badge"}
                        className="card-badge-icon"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <span className={`card-badge ${badge?.attributes?.icon_url ? "hidden" : ""}`} style={{ backgroundColor: color }}>
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

      {showInfo && <BadgeInfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}
