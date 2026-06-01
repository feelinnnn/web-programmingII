"use client";

import './EvidenceModal.css';
import { useUserId } from "@/lib/useauth";
import { useState } from "react";

export default function EvidenceModal({ 
  isOpen, 
  onClose, 
  badgeId, 
  badgeTypeSnapshot 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  badgeId: string | null; 
  badgeTypeSnapshot: string | null; 
}) {
  const userId = useUserId();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setLoading(true);

    try {
      // 1. Upload all files to Cloudinary
      const urls = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          const { url } = await res.json();
          return url;
        })
      );

      // 2. Submit to /api/user-badges
      await fetch('/api/user-badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            attributes: {
              userId,
              badgeId,
              badgeTypeSnapshot,
              userNote: note,
              evidenceUrls: urls,
            }
          }
        })
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="left">
          <label className="upload-box">
            <input 
              type="file" 
              hidden 
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))} 
            />
            <div className="upload-content">
              <span>{files.length > 0 ? `${files.length} file(s) selected` : "Upload file"}</span>
            </div>
            <div className="upload-bar">
              <span className="icon">
                <img src="icon/clip.png" alt="" />
              </span>
            </div>
          </label>

          <div className="note-box">
            <textarea
              placeholder="note..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="right">
          <button className="close" onClick={onClose}>✕</button>
          <img src="icon/medal.png" width={221} height={221} style={{ width: "100%", height: "auto", maxWidth: "221px" }} />
          <h2>Submit evidence for [lesson name]</h2>
          <p>You will receive this badge</p>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}