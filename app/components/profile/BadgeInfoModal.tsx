"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "././BadgeInfoModal.css";

interface Props {
  onClose: () => void;
}

const INFO = [
  { color: "#A0D585", label: "Self Declared" },
  { color: "#FFA95A", label: "Lesson Evidence Backed" },
  { color: "#FF5A5A", label: "Expert Certified" },
  { color: "#FFD45A", label: "Lesson" },
];

export default function BadgeInfoModal({ onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const modal = (
    <div className="bi-overlay" onClick={onClose}>
      <div className="bi-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="bi-title">Type Badges</h3>
        <div className="bi-list">
          {INFO.map((item) => (
            <div key={item.label} className="bi-row">
              <span className="bi-dot" style={{ backgroundColor: item.color }} />
              <span className="bi-label">{item.label}</span>
            </div>
          ))}
        </div>
        <button className="bi-closeBtn" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
