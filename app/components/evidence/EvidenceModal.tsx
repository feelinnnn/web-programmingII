"use client";

import './EvidenceModal.css';
import { useUserId } from "@/lib/useauth";
import { useState } from "react";

export default function EvidenceModal({
  isOpen,
  onClose,
  badgeId,
  badgeTypeSnapshot,
  lessonName,
  badgeName
}: {
  isOpen: boolean;
  onClose: () => void;
  badgeId: string | null;
  badgeTypeSnapshot: string | null;
  lessonName?: string;
  badgeName?: string;
}) {
  const userId = useUserId();
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    setFiles([...files, ...newFiles]);
    // Clear input so same file can be added again
    e.target.value = '';
  };

  const handleDeleteFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

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
              onChange={handleAddFiles}
            />
            {files.length > 0 ? (
              <div className="files-list-content">
                <h3>{files.length} file(s) selected</h3>
                <ul>
                  {files.map((file, index) => (
                    <li key={index}>
                      <div className="file-info">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteFile(index)}
                        type="button"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="upload-content">
                <span>Click to add files</span>
              </div>
            )}
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
          <h2>Submit evidence for {lessonName || "[lesson name]"}</h2>
          <p>You will receive<br />{badgeName || "this badge"} badge</p>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}
