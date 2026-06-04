"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import "../profile/profile.css";
import BadgeInfoModal from "../../components/profile/BadgeInfoModal";
import BadgeDetailModal from "../../components/profile/BadgeDetailModal";
import ViewProfileModal from "../../components/profile/ViewProfileModal";

interface UserData {
  id: string;
  attributes: {
    display_name: string;
    sub_namebio: string;
    bio: string;
    profile_image_url: string;
    email: string;
    role: string;
    follower_count?: number;
    following_count?: number;
    post_count?: number;
    lesson_complete?: number;
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
  const type = b.attributes?.badge_type_snapshot || b.attributes?.badgeTypeSnapshot || "";
  if (type === "self-declared") return "#A0D585";
  if (type === "evidence-backed") return "#FFA95A";
  if (type === "expert-certified") return "#FF5A5A";
  if (type === "lesson") return "#FFD45A";
  return "#A0D585";
}

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 10000) return Math.round(n / 1000) + "K";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export default function UserProfilePage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [detailBadge, setDetailBadge] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => { setPage(1); }, [search, colorFilter]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((json) => { setUser(json.data); return json.data; })
      .then((userData) => {
        // Check follow status
        return fetch(`/api/users/${userId}/follow`)
          .then((res) => res.json())
          .then((data) => {
            setFollowing(data.following);
            // Store user_id for event matching
            if (userData?.attributes?.user_id && typeof window !== "undefined") {
              (window as any).__profileUserId = userData.attributes.user_id;
            }
          });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // Listen for follow-changed from community feed PostCards
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const profileUid = (window as any).__profileUserId;
      if (detail.authorUserId && profileUid && detail.authorUserId === profileUid) {
        setFollowing(detail.isFollowing);
      }
    };
    window.addEventListener("follow-changed", handler);
    return () => window.removeEventListener("follow-changed", handler);
  }, []);

  const toggleFollow = async () => {
    setFollowLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setFollowing(data.following);
      // Refresh to update counts
      const fres = await fetch(`/api/users/${userId}`);
      const fjson = await fres.json();
      if (fjson.data) setUser(fjson.data);
    } catch {} finally { setFollowLoading(false); }
  };

  if (!userId) return <div className="layout-container"><main className="main-content" style={{ padding: "2rem" }}><p>No user specified.</p></main></div>;
  if (loading) return <div className="layout-container"><main className="main-content" style={{ padding: "2rem" }}><p>Loading...</p></main></div>;
  if (!user) return <div className="layout-container"><main className="main-content" style={{ padding: "2rem" }}><p>User not found.</p></main></div>;

  const { attributes, relationships } = user;
  const stats = relationships?.stats?.data;
  const badges = relationships?.badges?.data || [];

  // Only show showcased badges on public profile
  const displayBadges = badges.filter((b: any) => b.attributes?.showcased);

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
                <h1>
                  {attributes.display_name || "Cook"}
                  <button
                    className={`follow-btn ${following ? "following" : ""}`}
                    onClick={toggleFollow}
                    disabled={followLoading}
                    style={{ marginLeft: 14, verticalAlign: "middle" }}
                  >
                    {followLoading ? "..." : following ? "✓ Following" : "+ Follow"}
                  </button>
                </h1>
                <p className="subtitle">
                  {attributes.sub_namebio || (attributes.role === "admin" ? "Admin" : "Home cook")}
                  <span className="social-icons">
                    {attributes.social_links?.instagram && (
                      <a href={attributes.social_links.instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/></svg>
                      </a>
                    )}
                    {attributes.social_links?.facebook && (
                      <a href={attributes.social_links.facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                      </a>
                    )}
                    {attributes.social_links?.twitter && (
                      <a href={attributes.social_links.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
                      </a>
                    )}
                    {attributes.social_links?.tiktok && (
                      <a href={attributes.social_links.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
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
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </span>
                    )}
                    <span onClick={() => setShowViewModal(true)} title="View profile card" style={{ cursor: "pointer" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                    </span>
                  </span>
                </p>
              </div>
            </div>
            <div className="profile-top-right">
              <input
                className="user-search-input"
                type="text"
                placeholder="Search user..."
                value={userSearch}
                onChange={async (e) => {
                  setUserSearch(e.target.value);
                  const q = e.target.value.trim();
                  if (!q) { setUserResults([]); setShowDropdown(false); return; }
                  try {
                    const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
                    const json = await res.json();
                    setUserResults(json.data || []);
                    setShowDropdown(true);
                  } catch { setUserResults([]); }
                }}
                onFocus={() => { if (userResults.length > 0) setShowDropdown(true); }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {showDropdown && userResults.length > 0 && (
                <ul className="user-dropdown">
                  {userResults.map((u: any) => (
                    <li key={u.id} className="user-dropdown-item"
                      onClick={() => {
                        setShowDropdown(false);
                        setUserSearch("");
                        window.location.href = `/user-profile?user_id=${u.id}`;
                      }}>
                      <img src={(u.profile_image_url || "/avatar/Avatar.png").replace(/=s\d+-c/, "=s400")} alt={u.display_name} className="user-dropdown-avatar" />
                      <div className="user-dropdown-info">
                        <span className="user-dropdown-name">{u.display_name}</span>
                        {u.sub_namebio && <span className="user-dropdown-bio">{u.sub_namebio}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <strong>{formatCount(user.attributes.follower_count ?? 0)}</strong>
              <span>Follower</span>
            </div>
            <div className="stat-box">
              <strong>{formatCount(user.attributes.following_count ?? 0)}</strong>
              <span>Following</span>
            </div>
            <div className="stat-box">
              <strong>{badges.filter((b: any) => b.attributes?.status === "verified").length}</strong>
              <span>Badge</span>
            </div>
            <div className="stat-box">
              <strong>{user.attributes.lesson_complete ?? 0}</strong>
              <span>Lesson Complete</span>
            </div>
            <div className="stat-box">
              <strong>{user.attributes.post_count ?? 0}</strong>
              <span>Post</span>
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
            {filteredBadges.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((b: any, i: number) => {
              const badge = b.relationships?.badge?.data;
              const color = getBadgeColor(b);
              const cardImg = badge?.attributes?.thumbnail_url || badge?.attributes?.icon_url || "/icon/medal.png";
              return (
                <div key={b.id || i} className="card" onClick={() => setDetailBadge({ badge: b, color })}>
                  <div className="card-image-area">
                    {cardImg ? (
                      <img
                        src={cardImg}
                        alt={badge?.attributes?.name || "Badge"}
                        className="card-badge-icon"
                        style={{ objectFit: badge?.attributes?.thumbnail_url ? "cover" : "contain" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="card-badge-pill" style={{ backgroundColor: color, color: "#333" }}>Badge</span>
                    <div className="card-label">{badge?.attributes?.name || "Unknown"}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredBadges.length > PER_PAGE && (
            <div className="pagination">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
              <span className="page-info">{page} / {Math.ceil(filteredBadges.length / PER_PAGE)}</span>
              <button className="page-btn" disabled={page >= Math.ceil(filteredBadges.length / PER_PAGE)} onClick={() => setPage(page + 1)}>Next ›</button>
            </div>
          )}
        </section>
      </main>

      {showInfo && <BadgeInfoModal onClose={() => setShowInfo(false)} />}

      {detailBadge && (
        <BadgeDetailModal
          badge={detailBadge.badge}
          color={detailBadge.color}
          onClose={() => setDetailBadge(null)}
        />
      )}

      {showViewModal && (
        <ViewProfileModal
          profile={{
            display_name: attributes.display_name,
            email: attributes.email,
            bio: attributes.bio,
            sub_namebio: attributes.sub_namebio || "",
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
