"use client";

import Image from "next/image"
import './EvidenceModal.css'; 
import { GetUserid } from "@/lib/useauth";
import { useEffect } from "react";




export default function EvidenceModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  const userId = GetUserid();
      useEffect(() => {
        console.log(userId)
        }, []);

  return (
    <div className="modal-overlay">
      <div className="modal">

        <div className="left">
          <label className="upload-box">
            <input type="file" hidden />

            <div className="upload-content">
              <span>Upload file</span>
            </div>

            <div className="upload-bar">
              <span className="icon">
                <img src="icon/clip.png" alt="" />

              </span>
            </div>
          </label>

          <div className="note-box">
            <span>note...</span>
          </div>
        </div>

        <div className="right">
          <button className="close" onClick={onClose}>✕</button>
          <img
            src="icon/medal.png"
            width={221}
            height={221}
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "221px"
            }}
          />

          <h2>Submit evidence for [lesson name]</h2>
          <p>You will receive this badge</p>

          <button className="submit-btn">Submit</button>
        </div>

      </div>
    </div>
  );
}