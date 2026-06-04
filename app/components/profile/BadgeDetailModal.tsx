"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./BadgeDetailModal.css";

interface EvidenceItem {
  url: string;
  description: string;
}

interface Props {
  badge: {
    id: string;
    attributes: {
      status: string;
      evidence_urls?: string[];
      user_note?: string[];
      badge_type_snapshot?: string;
      showcased?: boolean;
      certification_requested?: boolean;
      admin_comment?: string | null;
      adminComment?: string | null;
    };
    relationships?: {
      badge?: {
        data?: {
          id?: string;
          attributes?: {
            name?: string;
            description?: string;
            badge_type?: string;
            thumbnail_url?: string;
            icon_url?: string;
          };
        };
      };
    };
  };
  color: string;
  onClose: () => void;
  onVerify?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCancelRequest?: () => void;
}

function parseEvidenceItems(urls: string[] = [], notes: string[] = []): EvidenceItem[] {
  if (urls.length === 0 && notes.length === 0) return [];
  const items: EvidenceItem[] = [];
  const maxLen = Math.max(urls.length, notes.length);
  for (let i = 0; i < maxLen; i++) {
    items.push({ url: urls[i] || "", description: notes[i] || "" });
  }
  return items;
}

const TYPE_LABELS: Record<string, string> = {
  "self-declared": "Self Declared",
  "evidence-backed": "Evidence Backed",
  "expert-certified": "Expert Certified",
  "lesson": "Lesson",
};

export default function BadgeDetailModal({ badge, color, onClose, onVerify, onEdit, onDelete, onCancelRequest }: Props) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const badgeInfo = badge.relationships?.badge?.data;
  const name = badgeInfo?.attributes?.name || "Badge";
  const desc = badgeInfo?.attributes?.description || "";
  const badgeType = badge.attributes?.badge_type_snapshot || badge.attributes?.badgeTypeSnapshot || badgeInfo?.attributes?.badge_type || "";
  const status = badge.attributes?.status || "";
  const certRequested = badge.attributes?.certification_requested || badge.attributes?.certificationRequested || false;
  const isUserBadge = badgeType === "self-declared" || badgeType === "expert-certified" || badgeType === "evidence-backed";
  const thumbnail = badgeInfo?.attributes?.thumbnail_url;
  const icon = badgeInfo?.attributes?.icon_url;
  const evidenceUrls = badge.attributes?.evidence_urls || badge.attributes?.evidenceUrls || [];
  const rawNote = badge.attributes?.user_note || badge.attributes?.userNote || [];
  const adminComment = badge.attributes?.admin_comment || badge.attributes?.adminComment || null;
  const userNotesArr: string[] = Array.isArray(rawNote) ? rawNote : (rawNote ? [rawNote] : []);

  // Show evidence for any badge that has user-submitted evidence
  const hasEvidence = (evidenceUrls.length > 0 || userNotesArr.length > 0) && badgeType !== "lesson";
  const evidenceItems = hasEvidence ? parseEvidenceItems(evidenceUrls, userNotesArr) : [];

  // Build stages: badge image first (stage 0), then evidence items (stage 1+)
  const items = hasEvidence
    ? [{ url: icon || '', description: desc || 'Badge image' }, ...evidenceItems]
    : [];
  const totalStages = items.length;
  const currentItem = items[stage];
  const isBadgeStage = hasEvidence && stage === 0;

  // Media: badge icon is the default / primary view
  const currentMedia = hasEvidence
    ? (currentItem?.url || icon || thumbnail || null)
    : (icon || thumbnail || null);
  const currentDesc = isBadgeStage
    ? desc
    : (currentItem?.description || userNotesArr[0] || desc);

  const statusLabel = status === "verified" ? "Verified" : status === "pending" ? "Pending" : status === "non-request" ? "Not Requested" : status === "declined" ? "Declined" : "";
  const typeLabel = TYPE_LABELS[badgeType] || badgeType;

  // Actions — both self-declared and expert-certified can edit/request/cancel/delete
  const canEdit = isUserBadge && status === "non-request";
  const canResubmit = isUserBadge && status === "declined";
  const canRequestCertify = isUserBadge && status === "non-request";
  const canCancelRequest = isUserBadge && status === "pending";
  const canDelete = (status === "non-request" || status === "declined") && badgeType !== "lesson";

  const modal = (
    <div className="bd-overlay" onClick={onClose}>
      <div className="bd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="bd-close" onClick={onClose}>✕</button>

        <div className="bd-layout">
          {/* Left: Media */}
          <div className="bd-left">
            <div className="bd-mediaWrap">
              {currentMedia ? (
                currentMedia.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={currentMedia} controls className="bd-media" />
                ) : (
                  <img src={currentMedia} alt={name} className="bd-media" />
                )
              ) : (
                <div className="bd-noMedia">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </div>
              )}
            </div>

            {/* Stage nav — badge icon + evidence items */}
            {hasEvidence && totalStages > 1 && (
              <div className="bd-stageNav">
                <button className="bd-navBtn" disabled={stage <= 0} onClick={() => setStage(stage - 1)}>‹</button>
                <div className="bd-dots">
                  {items.map((_, i) => (
                    <span
                      key={i}
                      className={`bd-dot ${i === stage ? "active" : ""} ${i === 0 ? "badge-dot" : ""}`}
                      title={i === 0 ? "Badge" : `Evidence ${i}`}
                      onClick={() => setStage(i)}
                    />
                  ))}
                </div>
                <span className="bd-stageCount">{stage === 0 ? "Badge" : `${stage}/${totalStages - 1}`}</span>
                <button className="bd-navBtn" disabled={stage >= totalStages - 1} onClick={() => setStage(stage + 1)}>›</button>
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div className="bd-right">
            <div className="bd-rightTop">
              <div className="bd-tags">
                <span className="bd-typeTag" style={{ backgroundColor: color, color: "#333" }}>{typeLabel}</span>
                <span className={`bd-statusTag ${status}`}>{statusLabel}</span>
              </div>
              <h2 className="bd-name">{name}</h2>
              {currentDesc && <p className="bd-desc">{currentDesc}</p>}

              {/* Admin Feedback Section */}
              {(badge.attributes?.adminComment || badge.attributes?.admin_comment) && (
                <div className="bd-admin-feedback">
                  <span className="bd-admin-label">Admin Feedback</span>
                  <div className="bd-admin-text">
                    {badge.attributes.adminComment || badge.attributes.admin_comment}
                  </div>
                </div>
              )}
            </div>

            <div className="bd-rightBottom">
              {/* Evidence meta — show for any badge with evidence */}
              {hasEvidence && (
                <div className="bd-meta">
                  {evidenceUrls.length > 0 && <span>{evidenceUrls.length} evidence {evidenceUrls.length > 1 ? "items" : "item"}</span>}
                  <span>Status: <strong>{statusLabel}</strong></span>
                </div>
              )}

              {/* Admin feedback */}
              {adminComment && (
                <div className={`bd-adminFeedback ${status === "declined" ? "declined" : ""}`}>
                  <p className="bd-adminFeedbackText">{adminComment}</p>
                </div>
              )}

              {/* Waiting for expert to certify */}
              {isUserBadge && status === "pending" && certRequested && (
                <p className="bd-waiting">Waiting for expert to certify your badge</p>
              )}

              {/* Request Expert Certification */}
              {canRequestCertify && onVerify && (
                <button className="bd-verifyBtn" disabled={verifying} onClick={async () => { setVerifying(true); await onVerify(); setVerifying(false); }}>
                  {verifying ? "Sending..." : "Request Expert Certification"}
                </button>
              )}

              {/* Already requested — waiting for expert */}
              {isUserBadge && status === "pending" && !certRequested && (
                <p className="bd-waiting">✓ Certification requested — waiting for expert</p>
              )}

              {/* Cancel Request */}
              {canCancelRequest && onCancelRequest && (
                <button className="bd-cancelReqBtn" disabled={cancelling} onClick={async () => { setCancelling(true); onCancelRequest && await onCancelRequest(); setCancelling(false); }}>
                  {cancelling ? "Cancelling..." : "Cancel Request"}
                </button>
              )}

              {/* Resubmit (declined) */}
              {canResubmit && onEdit && (
                <button className="bd-resubmitBtn" onClick={onEdit}>Resubmit Evidence</button>
              )}

              {/* Edit + Delete */}
              {(canEdit || canDelete) && (
                <div className="bd-actionRow">
                  {canEdit && onEdit && (
                    <button className="bd-editBtn" onClick={onEdit}>Edit</button>
                  )}
                  {canDelete && onDelete && (
                    <button className="bd-deleteBtn" disabled={deleting} onClick={async () => { setDeleting(true); onDelete && await onDelete(); setDeleting(false); }}>
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              )}

              {/* Expert certified — evidence locked */}
              {isUserBadge && status === "verified" && hasEvidence && (
                <p className="bd-certified-note">✓ Certified by expert — evidence locked</p>
              )}

              <button className="bd-closeBtn" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
