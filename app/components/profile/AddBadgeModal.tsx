"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./AddBadgeModal.css";
import { useUserId } from "@/lib/useauth";

interface EvidenceItem {
  id: string;
  fileUrl: string;
  description: string;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
  editData?: any; // existing badge to edit
}

export default function AddBadgeModal({ onClose, onCreated, editData }: Props) {
  const userId = useUserId();
  const isEdit = !!editData;
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"select" | "evidence">(isEdit ? "evidence" : "select");
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [badges, setBadges] = useState<any[]>([]);
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); loadBadges(); }, []);

  // Init from editData
  useEffect(() => {
    if (!editData) return;
    const urls = editData.attributes?.evidence_urls || [];
    const notes = (editData.attributes?.user_note || "").split(" | ").filter(Boolean);
    const initItems = urls.map((url: string, i: number) => ({
      id: String(Date.now() + i),
      fileUrl: url,
      description: notes[i] || "",
    }));
    if (initItems.length === 0) initItems.push({ id: String(Date.now()), fileUrl: "", description: "" });
    setItems(initItems);
    setActiveItem(initItems[0].id);
    setSelectedBadge({
      id: editData.attributes?.badge_type_snapshot || "",
      name: editData.relationships?.badge?.data?.attributes?.name || "Badge",
    });
  }, [editData]);

  const loadBadges = async (q = "") => {
    try {
      const res = await fetch(`/api/badges/search?type=expert-certified${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      const json = await res.json();
      setBadges(json.data || []);
    } catch {}
  };

  const selectBadge = (badge: any) => {
    setSelectedBadge(badge);
    setStep("evidence");
    if (items.length === 0) {
      const first = { id: String(Date.now()), fileUrl: "", description: "" };
      setItems([first]);
      setActiveItem(first.id);
    }
  };

  const addEvidence = () => {
    const item = { id: String(Date.now()), fileUrl: "", description: "" };
    setItems([...items, item]);
    setActiveItem(item.id);
  };

  const removeEvidence = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    if (next.length === 0) return;
    setItems(next);
    if (activeItem === id) setActiveItem(next[0]?.id || null);
  };

  const activeEvidence = items.find((i) => i.id === activeItem) || items[0] || null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItem) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const { url } = await res.json();
      setItems(items.map((i) => (i.id === activeItem ? { ...i, fileUrl: url } : i)));
    } catch { setError("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleSubmit = async () => {
    if (!editData && !selectedBadge) { setError("Please select a badge"); return; }
    setLoading(true); setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const evidenceUrls = items.filter((i) => i.fileUrl).map((i) => i.fileUrl);
      const userNote = items.filter((i) => i.description).map((i) => i.description).join(" | ");

      if (isEdit) {
        // PATCH existing badge
        const res = await fetch(`/api/user-badges/${editData.id}`, {
          method: "PATCH", headers,
          body: JSON.stringify({ evidenceUrls, userNote }),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        // POST new badge
        const res = await fetch("/api/user-badges", {
          method: "POST", headers,
          body: JSON.stringify({ data: { attributes: { userId, badgeId: selectedBadge.id, badgeTypeSnapshot: "self-declared", userNote: userNote || selectedBadge.name, evidenceUrls } } }),
        });
        if (!res.ok) throw new Error("Failed");
      }
      onCreated(); onClose();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const modal = (
    <div className="ab-overlay" onClick={onClose}>
      <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
        {error && <p className="ab-error">{error}</p>}

        {step === "select" && (
          <div className="ab-selectPanel">
            <h2 className="ab-title">{isEdit ? "Edit Badge" : "Select Expert Certified Badge"}</h2>
            <input className="ab-input ab-searchInput" value={search} onChange={(e) => { setSearch(e.target.value); loadBadges(e.target.value); }} placeholder="Search badges..." />
            <div className="ab-badgeGrid">
              {badges.map((b) => (
                <div key={b.id} className={`card ${selectedBadge?.id === b.id ? "selected" : ""}`} onClick={() => selectBadge(b)} style={{ height: 160, cursor: "pointer" }}>
                  <div className="card-image-area">
                    {b.icon_url ? (
                      <img src={b.icon_url} alt={b.name} className="card-badge-icon" />
                    ) : null}
                    <span className="card-badge-pill" style={{ backgroundColor: "#FF5A5A", color: "#fff" }}>Badge</span>
                    <div className="card-label">{b.name}</div>
                  </div>
                </div>
              ))}
              {badges.length === 0 && <p className="ab-empty">No badges found</p>}
            </div>
            <div className="ab-buttons">
              <button className="ab-cancel" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {step === "evidence" && (
          <div className="ab-editorLayout">
            {/* Col 1: Badge info */}
            <div className="ab-col1">
              {!isEdit && <button className="ab-back" onClick={() => setStep("select")}>← Back</button>}
              <div className="ab-selectedBadge">
                <h3>{selectedBadge?.name || "Badge"}</h3>
                <span className="ab-badgeTypeTag">{isEdit ? "Self Declared" : "Expert Certified"}</span>
              </div>
            </div>

            {/* Col 2: Evidence list */}
            <div className="ab-col2">
              <div className="ab-col2Header">Evidence</div>
              <div className="ab-evidenceList">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`ab-evCard ${activeItem === item.id ? "active" : ""}`}
                    onClick={() => setActiveItem(item.id)}
                  >
                    <div className="ab-evThumb">
                      {item.fileUrl ? (
                        item.fileUrl.match(/\.(mp4|webm|mov)$/i) ? (
                          <video src={item.fileUrl} />
                        ) : (
                          <img src={item.fileUrl} alt="" />
                        )
                      ) : (
                        <span className="ab-evEmpty">#{idx + 1}</span>
                      )}
                    </div>
                    {items.length > 1 && (
                      <button className="ab-evRemove" onClick={(e) => { e.stopPropagation(); removeEvidence(item.id); }}>✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button className="ab-addBtn" onClick={addEvidence}>+ Add evidence</button>
            </div>

            {/* Col 3: Description */}
            <div className="ab-col3">
              <div className="ab-col3Header">
                Description
                {activeEvidence && <span className="ab-col3Num">#{items.findIndex((i) => i.id === activeEvidence.id) + 1}</span>}
              </div>

              <label className="ab-uploadArea">
                {activeEvidence?.fileUrl ? (
                  activeEvidence.fileUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={activeEvidence.fileUrl} controls className="ab-mediaPreview" />
                  ) : (
                    <img src={activeEvidence.fileUrl} alt="" className="ab-mediaPreview" />
                  )
                ) : (
                  <span className="ab-uploadHint">{uploading ? "Uploading..." : "Click to upload evidence"}</span>
                )}
                <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="ab-fileInput" />
              </label>

              <textarea
                className="ab-descInput"
                value={activeEvidence?.description || ""}
                onChange={(e) => {
                  if (!activeItem) return;
                  setItems(items.map((i) => (i.id === activeItem ? { ...i, description: e.target.value } : i)));
                }}
                placeholder="Describe this evidence..."
                rows={6}
              />

              <div className="ab-buttons">
                <button className="ab-cancel" onClick={onClose}>Cancel</button>
                <button className="ab-save" onClick={handleSubmit} disabled={loading || uploading}>
                  {loading ? "Saving..." : isEdit ? "Update Badge" : "Create Badge"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
