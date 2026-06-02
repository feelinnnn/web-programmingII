"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./ViewProfileModal.css";

interface Props {
  profile: {
    display_name: string;
    email: string;
    bio: string;
    sub_namebio: string;
    profile_image_url: string;
    role: string;
    social_links: {
      instagram: string;
      facebook: string;
      twitter: string;
      tiktok: string;
      youtube: string;
    };
  };
  onClose: () => void;
}

export default function ViewProfileModal({ profile, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hasAnySocial =
    profile.social_links?.instagram ||
    profile.social_links?.facebook ||
    profile.social_links?.twitter ||
    profile.social_links?.tiktok ||
    profile.social_links?.youtube;

  const avatarSrc = profile.profile_image_url || "/avatar/Avatar.png";

  const modal = (
    <div className="vm-overlay" onClick={onClose}>
      <div className="vm-viewModal" onClick={(e) => e.stopPropagation()}>
        <img
          src={avatarSrc}
          alt={profile.display_name}
          className="vm-viewAvatar"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/avatar/Avatar.png";
          }}
        />

        <h2 className="vm-viewName">{profile.display_name}</h2>

        {profile.bio && <p className="vm-viewBio">{profile.bio}</p>}

        <hr className="vm-viewDivider" />

        <div className="vm-viewRow">
          <span className="vm-viewIconCircle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <span
            className="vm-viewEmail"
            onClick={() => {
              navigator.clipboard.writeText(profile.email);
              alert("Email copied: " + profile.email);
            }}
            title="Click to copy email"
          >
            {profile.email}
          </span>
        </div>

        {hasAnySocial && (
          <>
            <hr className="vm-viewDivider" />
            <div className="vm-socialCircles">
              {profile.social_links?.instagram && (
                <a href={profile.social_links.instagram} target="_blank" rel="noopener noreferrer" title="Instagram" className="vm-socialCircleLink">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="3"/>
                  </svg>
                </a>
              )}
              {profile.social_links?.facebook && (
                <a href={profile.social_links.facebook} target="_blank" rel="noopener noreferrer" title="Facebook" className="vm-socialCircleLink">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
              )}
              {profile.social_links?.twitter && (
                <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" title="X (Twitter)" className="vm-socialCircleLink">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {profile.social_links?.tiktok && (
                <a href={profile.social_links.tiktok} target="_blank" rel="noopener noreferrer" title="TikTok" className="vm-socialCircleLink">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                  </svg>
                </a>
              )}
              {profile.social_links?.youtube && (
                <a href={profile.social_links.youtube} target="_blank" rel="noopener noreferrer" title="YouTube" className="vm-socialCircleLink">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
              )}
            </div>
          </>
        )}

        <button className="vm-closeOnlyBtn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
