"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "../profile/AddBadgeModal.css";
import { useUserId } from "@/lib/useauth";

interface EvidenceItem {
  id: string;
  fileUrl: string;
  description: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  badgeId: string;
  badgeType?: string;
  badgeName?: string;
  lessonName?: string;
}

export default function EvidenceModal({ isOpen, onClose, badgeId, badgeType, badgeName, lessonName }: Props) {
  const userId = useUserId();
  const router = useRouter();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const workerRef = useRef<Worker | null>(null);

  const type = badgeType || "evidence-backed";
  const badgeColor = "#FFA95A";
  const badgeTag = "Lesson Evidence Backed";

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
    return () => { workerRef.current?.terminate(); };
  }, []);

  // Init first evidence item
  useEffect(() => {
    if (isOpen && items.length === 0) {
      const first = { id: String(Date.now()), fileUrl: "", description: "" };
      setItems([first]);
      setActiveItem(first.id);
    }
  }, [isOpen]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeItem) return;
    setError("");
    setUploadingIds((prev) => { const next = new Set(prev); next.add(activeItem); return next; });

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
        setUploadingIds((prev) => { const next = new Set(prev); next.delete(activeItem); return next; });
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const userNotes = items.filter((i) => i.description).map((i) => i.description);
      const evidenceUrls = items.filter((i) => i.fileUrl).map((i) => i.fileUrl);

      if (evidenceUrls.length === 0) {
        setError("Please upload at least one evidence file");
        setLoading(false);
        return;
      }

      await fetch("/api/user-badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            attributes: {
              userId,
              badgeId,
              badgeTypeSnapshot: type,
              userNote: userNotes,
              evidenceUrls,
            },
          },
        }),
      });

      onClose();
      router.push("/profile");
    } catch (err) {
      console.error(err);
      setError("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ab-overlay" onClick={onClose}>
      <div className="ab-modal" onClick={(e) => e.stopPropagation()}>
        {error && <p className="ab-error">{error}</p>}

        <div className="ab-editorLayout">
          {/* Col 1: Badge info */}
          <div className="ab-col1">
            <div className="ab-selectedBadge">
              <h3>{badgeName || lessonName || "Badge"}</h3>
              {lessonName && <p style={{ fontSize: 12, color: "#999", margin: "4px 0 0" }}>For: {lessonName}</p>}
              <span className="ab-badgeTypeTag" style={{ backgroundColor: badgeColor, color: "#fff" }}>
                {badgeTag}
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
                      <button className="ab-evRemove" onClick={(e) => { e.stopPropagation(); removeEvidence(item.id); }}>
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
                <span className="ab-col3Num">#{items.findIndex((i) => i.id === activeEvidence.id) + 1}</span>
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
              <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="ab-fileInput" disabled={isItemUploading} />
            </label>

            <textarea
              className="ab-descInput"
              value={activeEvidence?.description || ""}
              onChange={(e) => { if (!activeItem) return; setItems(items.map((i) => (i.id === activeItem ? { ...i, description: e.target.value } : i))); }}
              placeholder="Describe this evidence..."
              rows={6}
            />

            <div className="ab-buttons">
              <button className="ab-cancel" onClick={onClose}>Cancel</button>
              <button className="ab-save" onClick={handleSubmit} disabled={loading || isAnythingUploading}>
                {loading ? "Submitting..." : "Submit Evidence"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
