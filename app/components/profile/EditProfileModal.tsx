"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import "./EditProfileModal.css";

interface Props {
  initialData: {
    email: string;
    display_name: string;
    bio: string;
    profile_image_url: string;
    social_links: {
      instagram: string;
      facebook: string;
      twitter: string;
      tiktok: string;
      youtube: string;
    };
  };
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileModal({ initialData, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    display_name: initialData.display_name || "",
    bio: initialData.bio || "",
    profile_image_url: initialData.profile_image_url || "",
    instagram: initialData.social_links?.instagram || "",
    facebook: initialData.social_links?.facebook || "",
    twitter: initialData.social_links?.twitter || "",
    tiktok: initialData.social_links?.tiktok || "",
    youtube: initialData.social_links?.youtube || "",
  });

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setMounted(true); }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const body = {
      display_name: form.display_name,
      bio: form.bio,
      profile_image_url: form.profile_image_url,
      social_links: {
        instagram: form.instagram,
        facebook: form.facebook,
        twitter: form.twitter,
        tiktok: form.tiktok,
        youtube: form.youtube,
      },
    };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errors?.[0]?.detail || "Failed to update profile");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="em-overlay" onClick={onClose}>
      <div className="em-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="em-modalTitle">Edit Profile</h2>

        {error && <p className="em-errorMessage">{error}</p>}

        <div className="em-modalAvatar">
          <Image
            src={(form.profile_image_url || "/avatar/Avatar.png").replace(/=s\d+-c/, "=s400")}
            alt="Preview"
            width={80}
            height={80}
          />
        </div>

        <label className="em-fieldLabel">
          Display Name
          <input
            className="em-fieldInput"
            name="display_name"
            value={form.display_name}
            onChange={handleChange}
          />
        </label>

        <label className="em-fieldLabel">
          Bio
          <textarea
            className="em-fieldTextarea"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
          />
        </label>

        <label className="em-fieldLabel">
          Profile Image URL
          <input
            className="em-fieldInput"
            name="profile_image_url"
            value={form.profile_image_url}
            onChange={handleChange}
          />
        </label>

        <h3 className="em-sectionTitle">Social Links</h3>

        <label className="em-fieldLabel">Instagram
          <input className="em-fieldInput" name="instagram" value={form.instagram} onChange={handleChange} placeholder="Instagram URL" />
        </label>
        <label className="em-fieldLabel">Facebook
          <input className="em-fieldInput" name="facebook" value={form.facebook} onChange={handleChange} placeholder="Facebook URL" />
        </label>
        <label className="em-fieldLabel">Twitter
          <input className="em-fieldInput" name="twitter" value={form.twitter} onChange={handleChange} placeholder="X (Twitter) URL" />
        </label>
        <label className="em-fieldLabel">TikTok
          <input className="em-fieldInput" name="tiktok" value={form.tiktok} onChange={handleChange} placeholder="TikTok URL" />
        </label>
        <label className="em-fieldLabel">YouTube
          <input className="em-fieldInput" name="youtube" value={form.youtube} onChange={handleChange} placeholder="YouTube URL" />
        </label>

        <div className="em-buttons">
          <button className="em-saveBtn" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button className="em-cancelBtn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
