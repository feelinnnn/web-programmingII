"use client";

import { useEffect, useState, useCallback } from "react";
import { useUserId } from "@/lib/useauth";
import Swal from 'sweetalert2';
import BadgeDetailModal from "../../components/profile/BadgeDetailModal";
import BadgeInfoModal from "../../components/profile/BadgeInfoModal";
import AddBadgeModal from "../../components/profile/AddBadgeModal";
import "./badge.css";

function getBadgeColor(badgeType: string): string {
  if (badgeType === "self-declared") return "#A0D585";      // green
  if (badgeType === "evidence-backed") return "#FFA95A";    // orange
  if (badgeType === "expert-certified") return "#FF5A5A";   // red
  if (badgeType === "lesson") return "#FFD45A";             // yellow
  return "#A0D585"; // fallback green
}

export default function BadgesPage() {
  const userId = useUserId();
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showAddBadge, setShowAddBadge] = useState(false);
  const [detailBadge, setDetailBadge] = useState<any>(null);
  const [editBadge, setEditBadge] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"all" | "verified" | "pending" | "non-request" | "declined">("all");

  const fetchBadges = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/user-badges?userId=${encodeURIComponent(userId)}`, { headers });
      if (!res.ok) throw new Error(`Failed to fetch badges (${res.status})`);
      const json = await res.json();
      setBadges(json.data || []);
    } catch (err: any) {
      console.error("Badge fetch error:", err);
      setError(err.message || "Failed to load badges");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Group badges by status
  const verifiedBadges = badges.filter((b: any) => b.attributes?.status === "verified");
  const nonRequestBadges = badges.filter((b: any) => b.attributes?.status === "non-request");
  const pendingBadges = badges.filter((b: any) => b.attributes?.status === "pending");
  const declinedBadges = badges.filter((b: any) => b.attributes?.status === "declined");

  // Selected tab data
  const getTabBadges = () => {
    if (activeTab === "verified") return verifiedBadges;
    if (activeTab === "non-request") return nonRequestBadges;
    if (activeTab === "pending") return pendingBadges;
    if (activeTab === "declined") return declinedBadges;
    return badges;
  };

  const tabBadges = getTabBadges();

  // Filter by search and color
  const filteredBadges = tabBadges.filter((b: any) => {
    if (search.trim()) {
      const name = b.relationships?.badge?.data?.attributes?.name || "";
      if (!name.toLowerCase().includes(search.toLowerCase())) return false;
    }
    if (colorFilter) {
      const badgeType = b.attributes?.badgeTypeSnapshot
        || b.relationships?.badge?.data?.attributes?.badge_type
        || "";
      if (getBadgeColor(badgeType) !== colorFilter) return false;
    }
    return true;
  });

  // Color counts for current tab
  const colorCounts: Record<string, number> = {};
  tabBadges.forEach((b: any) => {
    const badgeType = b.attributes?.badgeTypeSnapshot
      || b.relationships?.badge?.data?.attributes?.badge_type
      || "";
    const c = getBadgeColor(badgeType);
    colorCounts[c] = (colorCounts[c] || 0) + 1;
  });

  if (loading) {
    return (
      <div className="layout-container">
        <main className="main-content">
          <div className="badges-page">
            <p style={{ padding: "2rem", color: "#888" }}>Loading badges...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="layout-container">
        <main className="main-content">
          <div className="badges-page">
            <p style={{ padding: "2rem", color: "#c0392b" }}>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout-container">
      <main className="main-content">
        <div className="badges-page">
          <h1 className="page-title">Badges Status</h1>

          {/* Tab bar */}
          <div className="bs-tabs">
            <button
              className={`bs-tab ${activeTab === "all" ? "active" : ""}`}
              onClick={() => { setActiveTab("all"); setColorFilter(null); }}
            >
              All <span className="bs-tab-count">{badges.length}</span>
            </button>
            <button
              className={`bs-tab ${activeTab === "verified" ? "active" : ""}`}
              onClick={() => { setActiveTab("verified"); setColorFilter(null); }}
            >
              <span className="status-dot verified" /> Verified <span className="bs-tab-count">{verifiedBadges.length}</span>
            </button>
            <button
              className={`bs-tab ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => { setActiveTab("pending"); setColorFilter(null); }}
            >
              <span className="status-dot pending" /> Pending <span className="bs-tab-count">{pendingBadges.length}</span>
            </button>
            <button
              className={`bs-tab ${activeTab === "non-request" ? "active" : ""}`}
              onClick={() => { setActiveTab("non-request"); setColorFilter(null); }}
            >
              <span className="status-dot non-request" /> Non-Request <span className="bs-tab-count">{nonRequestBadges.length}</span>
            </button>
            <button
              className={`bs-tab ${activeTab === "declined" ? "active" : ""}`}
              onClick={() => { setActiveTab("declined"); setColorFilter(null); }}
            >
              <span className="status-dot declined" /> Declined <span className="bs-tab-count">{declinedBadges.length}</span>
            </button>

            <div className="bs-tab-right">
              <button className="add-btn" onClick={() => setShowAddBadge(true)}>+ Add</button>
            </div>
          </div>

          {/* Search */}
          <div className="showcase-search">
            <input
              className="search-input"
              type="text"
              placeholder="Search badges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Color filter tags */}
          <div className="filter-tags">
            <span
              className={`tag tag-all ${!colorFilter ? "active" : ""}`}
              onClick={() => setColorFilter(null)}
            >
              All <span className="count">{tabBadges.length}</span>
            </span>
            <span
              className={`tag tag-green ${colorFilter === "#A0D585" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#A0D585" ? null : "#A0D585")}
            >
              Badge <span className="count">{colorCounts["#A0D585"] || 0}</span>
            </span>
            <span
              className={`tag tag-orange ${colorFilter === "#FFA95A" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#FFA95A" ? null : "#FFA95A")}
            >
              Badge <span className="count">{colorCounts["#FFA95A"] || 0}</span>
            </span>
            <span
              className={`tag tag-red ${colorFilter === "#FF5A5A" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#FF5A5A" ? null : "#FF5A5A")}
            >
              Badge <span className="count">{colorCounts["#FF5A5A"] || 0}</span>
            </span>
            <span
              className={`tag tag-yellow ${colorFilter === "#FFD45A" ? "active" : ""}`}
              onClick={() => setColorFilter(colorFilter === "#FFD45A" ? null : "#FFD45A")}
            >
              Badge <span className="count">{colorCounts["#FFD45A"] || 0}</span>
            </span>
            <img
              src="/icon/giveinfo.svg"
              className="filter-info-btn"
              alt="info"
              onClick={() => setShowInfo(true)}
            />
          </div>

          {/* Card grid */}
          <div className="card-grid">
            {filteredBadges.length === 0 && (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#888" }}>
                No badges found.
              </p>
            )}
            {filteredBadges.map((userBadge: any, i: number) => {
              const badge = userBadge.relationships?.badge?.data;
              const badgeType = userBadge.attributes?.badgeTypeSnapshot
                || badge?.attributes?.badge_type
                || "";
              const color = getBadgeColor(badgeType);
              const iconUrl = badge?.attributes?.thumbnail_url || badge?.attributes?.icon_url || "/icon/medal.png";
              return (
                <div
                  key={userBadge.id || i}
                  className="card"
                  onClick={() => setDetailBadge({ badge: userBadge, color })}
                >
                  <div className="card-image-area">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={badge?.attributes?.name || "Badge"}
                        className="card-badge-icon"
                        style={{ objectFit: badge?.attributes?.thumbnail_url ? "cover" : "contain" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : null}
                    <span className="card-badge-pill" style={{ backgroundColor: color, color: "#333" }}>
                      Badge
                    </span>
                    <div className="card-label">{badge?.attributes?.name || "Badge"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showInfo && <BadgeInfoModal onClose={() => setShowInfo(false)} />}

      {showAddBadge && (
        <AddBadgeModal
          onClose={() => setShowAddBadge(false)}
          onCreated={() => { setShowAddBadge(false); fetchBadges(); }}
        />
      )}

      {editBadge && (
        <AddBadgeModal
          editData={editBadge}
          onClose={() => setEditBadge(null)}
          onCreated={() => { setEditBadge(null); fetchBadges(); }}
        />
      )}

      {detailBadge && (
        <BadgeDetailModal
          badge={detailBadge.badge}
          color={detailBadge.color}
          onClose={() => setDetailBadge(null)}
          onVerify={async () => {
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/user-badges/${detailBadge.badge.id}/verify`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
            if (!res.ok) return;
            setDetailBadge(null);
            fetchBadges();
          }}
          onEdit={() => {
            const b = detailBadge.badge;
            setDetailBadge(null);
            setEditBadge(b);
          }}
          onCancelRequest={async () => {
            const token = localStorage.getItem("token");
            await fetch(`/api/user-badges/${detailBadge.badge.id}/cancel`, {
              method: "PATCH",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setDetailBadge(null);
            fetchBadges();
          }}
          onDelete={async () => {
            const token = localStorage.getItem("token");
            await fetch(`/api/user-badges/${detailBadge.badge.id}`, {
              method: "DELETE",
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            setDetailBadge(null);
            fetchBadges();
          }}
        />
      )}
    </div>
  );
}
