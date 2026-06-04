"use client";

import { useState, useEffect, useRef } from "react";
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
  editData?: any;
}

type Step = "choose" | "select" | "evidence";
type BadgeChoice = "self-declared" | "expert-certified";

const BADGE_TYPES: { key: BadgeChoice; label: string; color: string; tag: string }[] = [
  { key: "self-declared", label: "Self Declared", color: "#A0D585", tag: "Self Declared" },
  { key: "expert-certified", label: "Expert Certified", color: "#FF5A5A", tag: "Expert Certified" },
];

export default function AddBadgeModal({ onClose, onCreated, editData }: Props) {
  const userId = useUserId();
  const isEdit = !!editData;
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>(isEdit ? "evidence" : "choose");
  const [badgeType, setBadgeType] = useState<BadgeChoice>("self-declared");
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [badges, setBadges] = useState<any[]>([]);
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const workerRef = useRef<Worker | null>(null);

  const activeType = BADGE_TYPES.find((t) => t.key === badgeType) || BADGE_TYPES[0];

  // Init Web Worker
  useEffect(() => {
    if (typeof Worker !== "undefined") {
      try {
        workerRef.current = new Worker("/workers/upload-worker.js");
        workerRef.current.onmessage = (e) => {
          const { id, url, success, error: errMsg } = e.data;
          setUploadingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          if (success && url) {
            setItems((prev) =>
              prev.map((i) => (i.id === id ? { ...i, fileUrl: url } : i))
            );
          } else {
            setError(errMsg || "Upload failed");
          }
        };
        workerRef.current.onerror = () => {
          setError("Worker error — upload may have failed");
        };
      } catch {
        workerRef.current = null;
      }
    }
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => { setMounted(true); }, []);

  // Init from editData
  useEffect(() => {
    if (!editData) return;
    const snapshot = editData.attributes?.badge_type_snapshot || "self-declared";
    setBadgeType(snapshot);
    const urls = editData.attributes?.evidence_urls || [];
    const notesArr = Array.isArray(editData.attributes?.user_note)
      ? editData.attributes.user_note
      : (editData.attributes?.user_note ? [editData.attributes.user_note] : []);
    const initItems = urls.map((url: string, i: number) => ({
      id: String(Date.now() + i),
      fileUrl: url,
      description: notesArr[i] || "",
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
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const searchRes = await fetch(
        `/api/badges/search?type=${badgeType}${q ? `&q=${encodeURIComponent(q)}` : ""}`
      );
      const searchJson = await searchRes.json();
      const allAvailable = searchJson.data || [];

      const userBadgesRes = await fetch(`/api/user-badges?userId=${userId}`, { headers });
      const userBadgesJson = await userBadgesRes.json();
      const ownedBadgeIds = (userBadgesJson.data || []).map((ub: any) => ub.attributes.badgeId);

      const filtered = allAvailable.filter((b: any) => !ownedBadgeIds.includes(b.id));
      setBadges(filtered);
    } catch (err) {
      console.error("Failed to load/filter badges:", err);
    }
  };

  const chooseType = (type: BadgeChoice) => {
    setBadgeType(type);
    setStep("select");
    setSearch("");
    setBadges([]);
  };

  useEffect(() => {
    if (step === "select" && badgeType) {
      loadBadges();
    }
  }, [step, badgeType]);

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
  const isItemUploading = activeItem ? uploadingIds.has(activeItem) : false;
  const isAnythingUploading = uploadingIds.size > 0;

  // Upload via Web Worker (or fallback to direct fetch)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItem) return;
    setError("");

    setUploadingIds((prev) => {
      const next = new Set(prev);
      next.add(activeItem);
      return next;
    });

    if (workerRef.current) {
      workerRef.current.postMessage({ file, id: activeItem });
    } else {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const { url } = await res.json();
        setItems((prev) =>
          prev.map((i) => (i.id === activeItem ? { ...i, fileUrl: url } : i))
        );
      } catch {
        setError("Upload failed");
      } finally {
        setUploadingIds((prev) => {
          const next = new Set(prev);
          next.delete(activeItem);
          return next;
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!editData && !selectedBadge) { setError("Please select a badge"); return; }
    setLoading(true); setError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const validItems = items.filter((i) => i.fileUrl);
      const evidenceUrls = validItems.map((i) => i.fileUrl);
      const userNotes = validItems.map((i) => i.description);

      if (isEdit) {
        const res = await fetch(`/api/user-badges/${editData.id}`, {
          method: "PATCH", headers,
          body: JSON.stringify({ evidenceUrls, userNote: userNotes }),
        });
        if (!res.ok) throw new Error("Failed to update");
      } else {
        const res = await fetch("/api/user-badges", {
          method: "POST", headers,
          body: JSON.stringify({
            data: {
              attributes: {
                userId,
                badgeId: selectedBadge.id,
                badgeTypeSnapshot: badgeType,
                userNote: userNotes.length > 0 ? userNotes : [selectedBadge.name],
                evidenceUrls,
              },
            },
          }),
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

        {/* ── Step 1: Choose badge type ── */}
        {step === "choose" && (
          <div className="ab-selectPanel">
            <h2 className="ab-title">Select Badge Type</h2>
            <p className="ab-subtitle">Choose the type of badge you want to claim</p>

            <div className="ab-typeGrid">
              {BADGE_TYPES.map((t) => (
                <div
                  key={t.key}
                  className="ab-typeCard"
                  onClick={() => chooseType(t.key)}
                  style={{ borderColor: t.color }}
                >
                  <div className="ab-typeCardIcon" style={{ backgroundColor: t.color }} />
                  <div className="ab-typeCardInfo">
                    <h3>{t.label}</h3>
                    <p>
                      {t.key === "self-declared"
                        ? "Claim a badge with your own evidence. You can request expert verification later."
                        : "Claim a badge and send evidence for expert certification."}
                    </p>
                  </div>
                  <span className="ab-typeArrow">&rarr;</span>
                </div>
              ))}
            </div>

            <div className="ab-buttons">
              <button className="ab-cancel" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Step 2: Select badge ── */}
        {step === "select" && (
          <div className="ab-selectPanel">
            <div className="ab-stepHeader">
              <button className="ab-back" onClick={() => setStep("choose")}>&larr; Back</button>
              <span className="ab-typeTag" style={{ backgroundColor: activeType.color, color: "#fff" }}>
                {activeType.label}
              </span>
            </div>
            <h2 className="ab-title">Select {activeType.label} Badge</h2>
            <input
              className="ab-input ab-searchInput"
              value={search}
              onChange={(e) => { setSearch(e.target.value); loadBadges(e.target.value); }}
              placeholder="Search badges..."
            />
            <div className="ab-badgeGrid">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`card ${selectedBadge?.id === b.id ? "selected" : ""}`}
                  onClick={() => selectBadge(b)}
                  style={{ height: 160, cursor: "pointer" }}
                >
                  <div className="card-image-area">
                    {b.icon_url ? (
                      <img src={b.icon_url} alt={b.name} className="card-badge-icon" />
                    ) : null}
                    <span className="card-badge-pill" style={{ backgroundColor: activeType.color, color: "#fff" }}>
                      Badge
                    </span>
                    <div className="card-label">{b.name}</div>
                  </div>
                </div>
              ))}
              {badges.length === 0 && <p className="ab-empty">No {activeType.label} badges found</p>}
            </div>
            <div className="ab-buttons">
              <button className="ab-cancel" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Evidence ── */}
        {step === "evidence" && (
          <div className="ab-editorLayout">
            {/* Col 1: Badge info */}
            <div className="ab-col1">
              {!isEdit && (
                <button className="ab-back" onClick={() => setStep("select")}>&larr; Back</button>
              )}
              <div className="ab-selectedBadge">
                <h3>{selectedBadge?.name || "Badge"}</h3>
                <span className="ab-badgeTypeTag" style={{ backgroundColor: activeType.color, color: "#fff" }}>
                  {activeType.tag}
                </span>
              </div>
            </div>

            {/* Col 2: Evidence list */}
            <div className="ab-col2">
              <div className="ab-col2Header">Evidence</div>
              <div className="ab-evidenceList">
                {items.map((item, idx) => {
                  const isUploadingThis = uploadingIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`ab-evCard ${activeItem === item.id ? "active" : ""} ${isUploadingThis ? "uploading" : ""}`}
                      onClick={() => setActiveItem(item.id)}
                    >
                      <div className="ab-evThumb">
                        {isUploadingThis ? (
                          <span className="ab-evSpinner" />
                        ) : item.fileUrl ? (
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
                        <button
                          className="ab-evRemove"
                          onClick={(e) => { e.stopPropagation(); removeEvidence(item.id); }}
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="ab-addBtn" onClick={addEvidence}>+ Add evidence</button>
            </div>

            {/* Col 3: Upload + Description */}
            <div className="ab-col3">
              <div className="ab-col3Header">
                Description
                {activeEvidence && (
                  <span className="ab-col3Num">
                    #{items.findIndex((i) => i.id === activeEvidence.id) + 1}
                  </span>
                )}
              </div>

              <label className={`ab-uploadArea ${isItemUploading ? "uploading" : ""}`}>
                {isItemUploading ? (
                  <div className="ab-uploadLoading">
                    <span className="ab-spinner" />
                    <span className="ab-uploadText">Uploading...</span>
                  </div>
                ) : activeEvidence?.fileUrl ? (
                  activeEvidence.fileUrl.match(/\.(mp4|webm|mov)$/i) ? (
                    <video src={activeEvidence.fileUrl} controls className="ab-mediaPreview" />
                  ) : (
                    <img src={activeEvidence.fileUrl} alt="" className="ab-mediaPreview" />
                  )
                ) : (
                  <span className="ab-uploadHint">Click to upload evidence</span>
                )}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="ab-fileInput"
                  disabled={isItemUploading}
                />
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
                <button
                  className="ab-save"
                  onClick={handleSubmit}
                  disabled={loading || isAnythingUploading}
                >
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
