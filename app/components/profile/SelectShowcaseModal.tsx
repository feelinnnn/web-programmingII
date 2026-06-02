"use client";

import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import "./SelectShowcaseModal.css";

interface BadgeData {
  id: string;
  type: string;
  attributes: {
    status: string;
    evidence_url?: string;
    user_note?: string;
    badge_type_snapshot?: string;
    submitted_at?: string;
    verified_at?: string;
  };
  relationships?: {
    badge?: {
      data?: {
        id: string;
        type: string;
        attributes?: {
          name?: string;
          description?: string;
          badge_type?: string;
          icon_url?: string;
        };
      };
    };
  };
}

interface Props {
  badges: BadgeData[];
  initialSelected: Set<string>;
  onSave: (selected: Set<string>) => void;
  onClose: () => void;
}

const MAX_PER_TYPE = 10;

const BADGE_TYPES = [
  { key: "self-declared", label: "Self Declared", color: "#A0D585" },
  { key: "evidence-backed", label: "Evidence Backed", color: "#FFA95A" },
  { key: "expert-certified", label: "Expert Certified", color: "#FF5A5A" },
  { key: "lesson", label: "Lesson", color: "#FFD45A" },
];

const FILTER_COLORS = ["#A0D585", "#FFA95A", "#FF5A5A", "#FFD45A"];

function getBadgeType(b: BadgeData): string {
  return b.attributes?.badge_type_snapshot || "self-declared";
}

function getBadgeColor(b: BadgeData): string {
  const type = getBadgeType(b);
  const found = BADGE_TYPES.find((t) => t.key === type);
  return found?.color || "#A0D585";
}

export default function SelectShowcaseModal({ badges, initialSelected, onSave, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [search, setSearch] = useState("");
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        const b = badges.find((x) => x.id === id);
        const type = b ? getBadgeType(b) : "";
        const count = [...next].filter((bid) => {
          const bb = badges.find((x) => x.id === bid);
          return bb && getBadgeType(bb) === type;
        }).length;
        if (count >= MAX_PER_TYPE) return prev;
        next.add(id);
      }
      return next;
    });
  };

  // Filter unselected badges
  const availableBadges = useMemo(() => {
    return badges.filter((b) => {
      if (selected.has(b.id)) return false;
      if (colorFilter && getBadgeColor(b) !== colorFilter) return false;
      if (search.trim()) {
        const name = b.relationships?.badge?.data?.attributes?.name || "";
        if (!name.toLowerCase().includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [badges, selected, colorFilter, search]);

  // Selected list
  const selectedBadges = useMemo(() => {
    return badges.filter((b) => selected.has(b.id));
  }, [badges, selected]);

  const colorCounts: Record<string, number> = {};
  badges.filter((b) => !selected.has(b.id)).forEach((b) => {
    const c = getBadgeColor(b);
    colorCounts[c] = (colorCounts[c] || 0) + 1;
  });

  const renderCard = (badge: BadgeData, isSelected: boolean, disabled: boolean) => {
    const badgeInfo = badge.relationships?.badge?.data;
    const name = badgeInfo?.attributes?.name || "Badge";
    const color = getBadgeColor(badge);

    return (
      <div
        key={badge.id}
        className={`ss-card ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""}`}
        onClick={() => !disabled && toggle(badge.id)}
      >
        <div className="ss-cardContent">
          <span className="ss-pill" style={{ backgroundColor: color }}>{name}</span>
          {isSelected && <span className="ss-checkmark">✓</span>}
          {disabled && <span className="ss-fullBadge">Full</span>}
        </div>
        <span className="ss-cardName">{name}</span>
      </div>
    );
  };

  const modal = (
    <div className="ss-overlay" onClick={onClose}>
      <div className="ss-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ss-modalHeader">
          <h2 className="ss-title">Select Showcase</h2>
          <span className="ss-selectedCount">{selected.size} selected</span>
        </div>

        {/* Search + Filters */}
        <div className="ss-toolbar">
          <input
            className="ss-search"
            type="text"
            placeholder="Search badges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="ss-filterRow">
            <span
              className={`ss-filterTag ${!colorFilter ? "active" : ""}`}
              onClick={() => setColorFilter(null)}
            >All</span>
            {FILTER_COLORS.map((c) => (
              <span
                key={c}
                className="ss-filterTag"
                style={{
                  backgroundColor: colorFilter === c ? c : "#fff",
                  borderColor: c,
                  color: colorFilter === c ? "#333" : "#666",
                }}
                onClick={() => setColorFilter(colorFilter === c ? null : c)}
              >
                Badge<span className="ss-filterCount">{colorCounts[c] || 0}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Two columns */}
        <div className="ss-body">
          <div className="ss-columns">
            {/* Available column */}
            <div className="ss-col">
              <h3 className="ss-colTitle">Available</h3>
              <div className="ss-grid">
                {availableBadges.length === 0 && (
                  <p className="ss-colEmpty">No badges found.</p>
                )}
                {availableBadges.map((b) => {
                  const type = getBadgeType(b);
                  const count = [...selected].filter((id) => {
                    const bb = badges.find((x) => x.id === id);
                    return bb && getBadgeType(bb) === type;
                  }).length;
                  const disabled = count >= MAX_PER_TYPE;
                  return renderCard(b, false, disabled);
                })}
              </div>
            </div>

            {/* Selected column */}
            <div className="ss-col">
              <h3 className="ss-colTitle">Selected ({selected.size})</h3>
              <div className="ss-grid">
                {selectedBadges.length === 0 && (
                  <p className="ss-colEmpty">No badges selected.</p>
                )}
                {selectedBadges.map((b) => renderCard(b, true, false))}
              </div>
            </div>
          </div>
        </div>

        <div className="ss-buttons">
          <button className="ss-cancelBtn" onClick={onClose}>
            Cancel
          </button>
          <button className="ss-saveBtn" onClick={() => { onSave(selected); onClose(); }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
