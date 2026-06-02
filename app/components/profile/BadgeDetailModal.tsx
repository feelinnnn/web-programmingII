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
      user_note?: string;
      badge_type_snapshot?: string;
      showcased?: boolean;
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
}

function parseEvidenceItems(urls: string[] = [], note: string = ""): EvidenceItem[] {
  if (urls.length === 0 && !note) return [];
  const items: EvidenceItem[] = [];
  const descriptions = note.split(" | ").filter(Boolean);
  urls.forEach((url, i) => {
    items.push({ url, description: descriptions[i] || "" });
  });
  if (urls.length === 0 && note) {
    items.push({ url: "", description: note });
  }
  return items;
}

const TYPE_LABELS: Record<string, string> = {
  "self-declared": "Self Declared",
  "evidence-backed": "Evidence Backed",
  "expert-certified": "Expert Certified",
  "lesson": "Lesson",
};

export default function BadgeDetailModal({ badge, color, onClose, onVerify, onEdit, onDelete }: Props) {
  const [mounted, setMounted] = useState(false);
  const [stage, setStage] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const badgeInfo = badge.relationships?.badge?.data;
  const name = badgeInfo?.attributes?.name || "Badge";
  const desc = badgeInfo?.attributes?.description || "";
  const badgeType = badge.attributes?.badge_type_snapshot || badgeInfo?.attributes?.badge_type || "";
  const status = badge.attributes?.status || "";
  const isSelfDeclared = badgeType === "self-declared";
  const thumbnail = badgeInfo?.attributes?.thumbnail_url;
  const icon = badgeInfo?.attributes?.icon_url;
  const evidenceUrls = badge.attributes?.evidence_urls || [];
  const userNote = badge.attributes?.user_note || "";

  const items = isSelfDeclared ? parseEvidenceItems(evidenceUrls, userNote) : [];
  const currentItem = items[stage];
  const currentMedia = isSelfDeclared
    ? (currentItem?.url || icon || evidenceUrls[0] || null)
    : (icon || thumbnail || evidenceUrls[0] || null);
  const currentDesc = currentItem?.description || userNote || desc;
  const totalStages = items.length;

  const statusLabel = status === "verified" ? "Verified" : status === "pending" ? "Not Verified" : status === "declined" ? "Declined" : "";
  const typeLabel = TYPE_LABELS[badgeType] || badgeType;

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

            {/* Stage nav - outside video */}
            {isSelfDeclared && totalStages > 1 && (
              <div className="bd-stageNav">
                <button className="bd-navBtn" disabled={stage <= 0} onClick={() => setStage(stage - 1)}>‹</button>
                <div className="bd-dots">
                  {items.map((_, i) => (
                    <span key={i} className={`bd-dot ${i === stage ? "active" : ""}`} onClick={() => setStage(i)} />
                  ))}
                </div>
                <span className="bd-stageCount">{stage + 1}/{totalStages}</span>
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
            </div>

            <div className="bd-rightBottom">
              {isSelfDeclared && (
                <div className="bd-meta">
                  {evidenceUrls.length > 0 && <span>{evidenceUrls.length} evidence {evidenceUrls.length > 1 ? "items" : "item"}</span>}
                  <span>Status: <strong>{statusLabel}</strong></span>
                </div>
              )}
              {isSelfDeclared && status === "pending" && onVerify && (
                <button className="bd-verifyBtn" disabled={verifying} onClick={async () => { setVerifying(true); await onVerify(); setVerifying(false); }}>
                  {verifying ? "Sending..." : "Request Verification"}
                </button>
              )}
              {isSelfDeclared && status === "pending" && (
                <div className="bd-editRow">
                  {onEdit && <button className="bd-editBtn" onClick={onEdit}>Edit</button>}
                  {onDelete && (
                    <button className="bd-deleteBtn" disabled={deleting} onClick={async () => { setDeleting(true); onDelete && await onDelete(); setDeleting(false); }}>
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
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
