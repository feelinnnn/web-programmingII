"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import "./panel.css";

interface PendingBadge {
  _id: string;
  userId: string;
  badgeId: string;
  status: string;
  evidenceUrls: string[];
  userNote: string[];
  badgeTypeSnapshot: string;
  submittedAt: string;
  user: {
    display_name: string;
    profile_image_url: string;
    email: string;
  } | null;
  badge: {
    name: string;
    description: string;
    icon_url: string;
    badge_type: string;
  } | null;
}

export default function ManagementHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingBadges, setPendingBadges] = useState<PendingBadge[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PendingBadge | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImgIndex, setPreviewImgIndex] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  // Lock scroll when modal is open
  useEffect(() => {
    if (selectedRequest || isPreviewOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [selectedRequest, isPreviewOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: any = { "Content-Type": "application/vnd.api+json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/profile", { headers });
        if (res.ok) {
          const json = await res.json();
          const profile = json.data.attributes;
          if (profile.role !== "admin" && profile.email !== "admin@cookcult.com") {
            router.push("/community");
            return;
          }
          fetchPendingBadges();
        } else {
          router.push("/community");
        }
      } catch (err) {
        router.push("/community");
      }
    };
    checkAuth();
  }, [router]);

  const fetchPendingBadges = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/verify-badges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.push("/community");
        return;
      }
      const json = await res.json();
      if (json.data) setPendingBadges(json.data);
    } catch (error) {
      console.error("Failed to fetch pending badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEvidenceItems = (badge: PendingBadge) => {
    const urls = badge.evidenceUrls || [];
    const notes = Array.isArray(badge.userNote) ? badge.userNote : [];
    if (urls.length === 0 && notes.length === 0) return [];
    const maxLen = Math.max(urls.length, notes.length);
    return Array.from({ length: maxLen }, (_, i) => ({ url: urls[i] || "", description: notes[i] || "" }));
  };

  const handleAction = async (status: "verified" | "declined") => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/verify-badges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userBadgeId: selectedRequest._id,
          status,
          adminComment,
        }),
      });

      if (res.ok) {
        setPendingBadges((prev) => prev.filter((b) => b._id !== selectedRequest._id));
        setSelectedRequest(null);
        setAdminComment("");
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) {
      console.error("Failed to process badge:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleLightboxPrev = (e: React.MouseEvent, itemsCount: number) => {
    e.stopPropagation();
    setPreviewImgIndex((prev) => (prev - 1 + itemsCount) % itemsCount);
  };

  const handleLightboxNext = (e: React.MouseEvent, itemsCount: number) => {
    e.stopPropagation();
    setPreviewImgIndex((prev) => (prev + 1) % itemsCount);
  };

  if (loading || !mounted) {
    return (
      <div className="admin-panel-container">
        <div className="loading-full">Synchronizing management data...</div>
      </div>
    );
  }

  const evidenceItems = selectedRequest ? getEvidenceItems(selectedRequest) : [];
  const currentItem = evidenceItems[activeStage];

  const renderModal = () => {
    if (!selectedRequest) return null;

    return createPortal(
      <>
        <div className="panel-modal-overlay" onClick={() => { setSelectedRequest(null); setActiveStage(0); }}>
          <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-panel-modal" onClick={() => { setSelectedRequest(null); setActiveStage(0); }}>✕</button>
            
            <div className="modal-user-info">
              <img src={selectedRequest.user?.profile_image_url || "/avatar/Avatar.png"} className="modal-avatar" alt="" />
              <div className="modal-user-details">
                <h2>{selectedRequest.user?.display_name || selectedRequest.user?.email}</h2>
                <span className="timestamp-label">Submitted: {new Date(selectedRequest.submittedAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="modal-content-grid">
              <div className="modal-evidence-area">
                <span className="modal-section-title">Evidence Review ({activeStage + 1}/{evidenceItems.length})</span>
                <div className="evidence-viewer-main">
                  <div 
                    className="viewer-media-wrap"
                    onClick={() => {
                      if (currentItem?.url && !currentItem.url.match(/\.(mp4|webm|mov)$/i)) {
                        setPreviewImgIndex(activeStage);
                        setIsPreviewOpen(true);
                      }
                    }}
                  >
                    {currentItem?.url ? (
                      currentItem.url.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={currentItem.url} controls className="viewer-media" />
                      ) : (
                        <img src={currentItem.url} className="viewer-media" alt="Evidence" />
                      )
                    ) : (
                      <div className="viewer-no-media">No visual evidence provided</div>
                    )}
                  </div>
                  
                  <div className="viewer-details">
                    <span className="detail-label">Evidence Description</span>
                    <div className="detail-value-box">{currentItem?.description || "No description provided."}</div>
                    
                    {evidenceItems.length > 1 && (
                      <div className="viewer-nav">
                        <button className="btn-panel-nav" disabled={activeStage === 0} onClick={() => setActiveStage(prev => prev - 1)}>‹ Previous</button>
                        <div className="viewer-dots">
                          {evidenceItems.map((_, i) => (
                            <span key={i} className={`viewer-dot ${i === activeStage ? 'active' : ''}`} onClick={() => setActiveStage(i)} />
                          ))}
                        </div>
                        <button className="btn-panel-nav" disabled={activeStage === evidenceItems.length - 1} onClick={() => setActiveStage(prev => prev + 1)}>Next ›</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <span className="modal-section-title">Requested Badge</span>
                <div className="modal-badge-card">
                  <img src={selectedRequest.badge?.icon_url || "/icon/medal.png"} className="modal-badge-img" alt="" />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: 'var(--brown-dark)' }}>{selectedRequest.badge?.name}</div>
                    <div className="badge-type-tag-sm">{selectedRequest.badgeTypeSnapshot}</div>
                    <p style={{ margin: '5px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{selectedRequest.badge?.description}</p>
                  </div>
                </div>
              </div>

              <div className="modal-decision-area">
                <span className="modal-section-title">Administrative Decision</span>
                <textarea 
                  className="modal-textarea"
                  placeholder="Provide feedback or reasons for this decision..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                />
                <div className="modal-actions">
                  <button className="btn-panel btn-panel-reject" disabled={processing} onClick={() => handleAction("declined")}>Reject</button>
                  <button className="btn-panel btn-panel-approve" disabled={processing} onClick={() => handleAction("verified")}>Verify & Approve</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Community Style Lightbox ── */}
        {isPreviewOpen && (
          <div className="lightbox-overlay" onClick={() => setIsPreviewOpen(false)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-lightbox" onClick={() => setIsPreviewOpen(false)}>×</button>
              <img src={evidenceItems[previewImgIndex].url} alt="Fullscreen Preview" className="lightbox-image" />
              {evidenceItems.length > 1 && (
                <>
                  <button className="lightbox-arrow-left" onClick={(e) => handleLightboxPrev(e, evidenceItems.length)}>‹</button>
                  <button className="lightbox-arrow-right" onClick={(e) => handleLightboxNext(e, evidenceItems.length)}>›</button>
                  <div className="lightbox-indicator">Evidence {previewImgIndex + 1} of {evidenceItems.length}</div>
                </>
              )}
            </div>
          </div>
        )}
      </>,
      document.body
    );
  };

  return (
    <div className="admin-panel-container">
      <div className="panel-header">
        <div className="panel-title-group">
          <h1 className="admin-title">Management Hub</h1>
          <span className="panel-subtitle">CookCult Executive Core</span>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">QUEUE SIZE</span>
          <span className="stat-value">{pendingBadges.length}</span>
        </div>
      </div>
      <h2 className="panel-section-title">Pending Certifications</h2>
      {pendingBadges.length === 0 ? (
        <div className="empty-state-v2">No pending requests found.</div>
      ) : (
        <div className="list-container">
          <div className="list-header">
            <span>User</span>
            <span>Badge</span>
            <span>Submission Date</span>
            <span style={{ textAlign: 'right' }}>Type</span>
          </div>
          {pendingBadges.map((item) => (
            <div key={item._id} className="list-item" onClick={() => { setSelectedRequest(item); setActiveStage(0); setAdminComment(""); }}>
              <div className="user-cell">
                <img src={item.user?.profile_image_url || "/avatar/Avatar.png"} className="user-avatar-sm" alt="" />
                <span className="user-display-name-list">{item.user?.display_name || item.user?.email || "Unknown"}</span>
              </div>
              <div className="badge-cell">
                <img 
                  src={item.badge?.thumbnail_url || item.badge?.icon_url || "/icon/medal.png"} 
                  className="badge-icon-sm" 
                  style={{ objectFit: item.badge?.thumbnail_url ? 'cover' : 'contain', borderRadius: '4px' }}
                  alt="" 
                />
                <span className="badge-name-list">{item.badge?.name || "Badge"}</span>
              </div>
              <div className="date-cell">{new Date(item.submittedAt).toLocaleDateString()}</div>
              <div className="type-cell"><span className="badge-type-tag-sm">{item.badgeTypeSnapshot}</span></div>
            </div>
          ))}
        </div>
      )}
      {renderModal()}
    </div>
  );
}
