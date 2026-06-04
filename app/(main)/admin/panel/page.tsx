"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import CreateBadgeModal from "../../../components/admin/CreateBadgeModal";
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
  const [activeTab, setActiveTab] = useState<"pending" | "library">("pending");
  const [pendingBadges, setPendingBadges] = useState<PendingBadge[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PendingBadge | null>(null);
  const [showCreateBadge, setShowCreateBadge] = useState(false);
  const [editBadgeData, setEditBadgeData] = useState<any>(null);
  const [adminComment, setAdminComment] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImgIndex, setPreviewImgIndex] = useState(0);

  useEffect(() => { setMounted(true); }, []);

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
          await Promise.all([fetchPendingBadges(), fetchAllBadges()]);
        } else {
          router.push("/community");
        }
      } catch (err) {
        router.push("/community");
      } finally {
        setLoading(false);
      }
    };
    if (mounted) checkAuth();
  }, [router, mounted]);

  const fetchPendingBadges = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/verify-badges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) setPendingBadges(json.data);
    } catch (error) {
      console.error("Failed to fetch pending badges:", error);
    }
  };

  const fetchAllBadges = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/badges", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) setAllBadges(json.data);
    } catch (error) {
      console.error("Failed to fetch all badges:", error);
    }
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

  const handleDeleteBadge = async (id: string) => {
    if (!confirm("Are you sure you want to delete this badge? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/admin/badges?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setAllBadges(prev => prev.filter(b => b._id !== id));
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error("Failed to delete badge:", err);
    }
  };

  const getEvidenceItems = (badge: PendingBadge) => {
    const urls = badge.evidenceUrls || [];
    const notes = Array.isArray(badge.userNote) ? badge.userNote : [];
    const maxLen = Math.max(urls.length, notes.length);
    if (maxLen === 0) return [{ url: "", description: "No evidence provided." }];
    return Array.from({ length: maxLen }, (_, i) => ({ 
      url: urls[i] || "", 
      description: notes[i] || (urls[i] ? "Visual evidence" : "No description.") 
    }));
  };

  if (loading || !mounted) {
    return <div className="loading-full">Management Hub Synchronizing...</div>;
  }

  const evidenceItems = selectedRequest ? getEvidenceItems(selectedRequest) : [];
  const currentItem = evidenceItems[activeStage];

  const renderModal = () => {
    if (!selectedRequest) return null;

    return createPortal(
      <div className="v-overlay" onClick={() => { setSelectedRequest(null); setActiveStage(0); }}>
        <div className="v-modal" onClick={(e) => e.stopPropagation()}>
          <button className="v-close" onClick={() => { setSelectedRequest(null); setActiveStage(0); }}>✕</button>
          
          <div className="v-body">
            <div className="v-media-section">
              <div className="v-media-container">
                {currentItem?.url ? (
                  currentItem.url.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={currentItem.url} controls className="v-media-file" />
                  ) : (
                    <img 
                      src={currentItem.url} 
                      className="v-media-file clickable" 
                      alt="Evidence" 
                      onClick={() => { setPreviewImgIndex(activeStage); setIsPreviewOpen(true); }}
                    />
                  )
                ) : (
                  <div className="v-no-media">No visual evidence provided</div>
                )}
              </div>
              
              <div className="v-media-info">
                <div className="v-info-header">
                  <span className="v-badge-pill">{selectedRequest.badgeTypeSnapshot}</span>
                  <span className="v-step">Evidence {activeStage + 1} of {evidenceItems.length}</span>
                </div>
                <div className="v-user-note">
                  <label>User Note</label>
                  <p>{currentItem?.description || "No description provided."}</p>
                </div>
                
                {evidenceItems.length > 1 && (
                  <div className="v-nav">
                    <button className="v-nav-btn" disabled={activeStage === 0} onClick={() => setActiveStage(prev => prev - 1)}>Previous</button>
                    <div className="v-nav-dots">
                      {evidenceItems.map((_, i) => (
                        <span key={i} className={`v-dot ${i === activeStage ? 'active' : ''}`} onClick={() => setActiveStage(i)} />
                      ))}
                    </div>
                    <button className="v-nav-btn" disabled={activeStage === evidenceItems.length - 1} onClick={() => setActiveStage(prev => prev + 1)}>Next</button>
                  </div>
                )}
              </div>
            </div>

            <div className="v-action-section">
              <div className="v-user-card">
                <img src={selectedRequest.user?.profile_image_url || "/avatar/Avatar.png"} className="v-user-img" alt="" />
                <div className="v-user-details">
                  <h3>{selectedRequest.user?.display_name || selectedRequest.user?.email}</h3>
                  <span className="v-email">{selectedRequest.user?.email}</span>
                  <div className="v-submit-time">
                    Submitted: {new Date(selectedRequest.submittedAt).toLocaleDateString()} at {new Date(selectedRequest.submittedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="v-badge-card">
                <img src={selectedRequest.badge?.icon_url || "/icon/medal.png"} className="v-badge-img" alt="" />
                <div className="v-badge-details">
                  <label>Requested Badge</label>
                  <h4>{selectedRequest.badge?.name}</h4>
                </div>
              </div>

              <div className="v-decision-box">
                <label className="v-label">Decision Feedback</label>
                <textarea 
                  className="v-textarea"
                  placeholder="Provide feedback or reasoning for the user..."
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                />
                <div className="v-actions">
                  <button className="v-btn v-btn-decline" disabled={processing} onClick={() => handleAction("declined")}>Decline</button>
                  <button className="v-btn v-btn-approve" disabled={processing} onClick={() => handleAction("verified")}>Approve Badge</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isPreviewOpen && (
          <div className="v-lightbox" onClick={() => setIsPreviewOpen(false)}>
            <button className="v-lightbox-close" onClick={() => setIsPreviewOpen(false)}>✕</button>
            <div className="v-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={evidenceItems[previewImgIndex].url} alt="Fullscreen" />
              {evidenceItems.length > 1 && (
                <>
                  <button className="v-lightbox-nav prev" onClick={() => setPreviewImgIndex((prev) => (prev - 1 + evidenceItems.length) % evidenceItems.length)}>‹</button>
                  <button className="v-lightbox-nav next" onClick={() => setPreviewImgIndex((prev) => (prev + 1) % evidenceItems.length)}>›</button>
                  <div className="v-lightbox-index">Evidence {previewImgIndex + 1} of {evidenceItems.length}</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <div className="admin-panel-container">
      <div className="panel-top-section">
        <div className="panel-header">
          <h1 className="admin-title">Management Hub</h1>
          <div className="panel-tabs">
            <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
              Pending ({pendingBadges.length})
            </button>
            <button className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
              Library ({allBadges.length})
            </button>
          </div>
        </div>
        <div className="header-divider-line"></div>
      </div>

      {activeTab === 'library' && (
        <div className="action-bar-below">
          <button className="btn-create-premium" onClick={() => { setEditBadgeData(null); setShowCreateBadge(true); }}>
            <span className="btn-icon">+</span>
            <span className="btn-text">Create New Badge</span>
          </button>
        </div>
      )}
      
      <div className="admin-content-area">
        {activeTab === 'pending' ? (
          <div className="section-fade-in">
            {pendingBadges.length === 0 ? (
              <div className="empty-state-v2">All caught up! No pending requests.</div>
            ) : (
              <div className="list-container">
                <div className="list-header">
                  <span>User</span>
                  <span>Badge</span>
                  <span>Submitted At</span>
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
                        src={item.badge?.thumbnail_url || "/icon/medal.png"} 
                        className="badge-icon-sm" 
                        alt="" 
                        onError={(e) => (e.currentTarget.src = "/icon/medal.png")}
                      />
                      <span className="badge-name-list">{item.badge?.name || "Badge"}</span>
                    </div>
                    <div className="date-cell">
                      {new Date(item.submittedAt).toLocaleDateString()}
                      <span className="time-sub"> {new Date(item.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="type-cell"><span className={`badge-type-tag-sm ${item.badgeTypeSnapshot}`}>{item.badgeTypeSnapshot}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="section-fade-in">
            <div className="list-container">
              <div className="list-header" style={{ gridTemplateColumns: '1.5fr 3fr 1fr 100px' }}>
                <span>Badge</span>
                <span>Description</span>
                <span>Type</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>
              {allBadges.length === 0 ? (
                <div className="empty-state-v2">No badges found in library.</div>
              ) : (
                allBadges.map((badge) => (
                  <div key={badge._id} className="list-item" style={{ gridTemplateColumns: '1.5fr 3fr 1fr 100px', cursor: 'default' }}>
                    <div className="badge-cell library-badge-cell">
                      <div className="badge-icon-wrapper">
                        <img src={badge.icon_url || "/icon/medal.png"} className="badge-icon-sm" alt="" />
                      </div>
                      <span className="badge-name-list">{badge.name}</span>
                    </div>
                    <div className="date-cell" style={{ fontSize: '13px' }}>{badge.description}</div>
                    <div className="type-cell"><span className={`badge-type-tag-sm ${badge.badge_type}`}>{badge.badge_type}</span></div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button className="action-link edit" onClick={() => { setEditBadgeData(badge); setShowCreateBadge(true); }}>Edit</button>
                      <button className="action-link delete" onClick={() => handleDeleteBadge(badge._id)}>Del</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {renderModal()}
      {showCreateBadge && (
        <CreateBadgeModal 
          onClose={() => setShowCreateBadge(false)} 
          onCreated={() => { setShowCreateBadge(false); fetchAllBadges(); }} 
          editData={editBadgeData}
        />
      )}
    </div>
  );
}
