import { useState, useEffect } from "react";
import "./LessonModal.css";
import { useRouter } from "next/navigation";
import { useUserId } from "@/lib/useauth";

type Chapter = { id: string; type: string };

type Lesson = {
  id: string;
  attributes: {
    title: string;
    description: string;
    thumbnail_url: string;
    badge: string;
  };
  relationships: {
    chapters: {
      data: Chapter[];
    };
  };
};

type Props = {
  lesson: Lesson | null;
  onClose: () => void;
};

export default function LessonModal({ lesson, onClose }: Props) {
  const router = useRouter();
  const userId = useUserId();
  const [badgeIcon, setBadgeIcon] = useState<string | null>(null);

  useEffect(() => {
    if (!lesson?.attributes?.badge) return;
    fetch(`/api/badges/${lesson.attributes.badge}`)
      .then(res => res.json())
      .then(data => {
        if (data?.data?.attributes?.icon_url) {
          setBadgeIcon(data.data.attributes.icon_url);
        }
      })
      .catch(() => {});
  }, [lesson?.attributes?.badge]);

  const gotoLesson = async (id: string) => {
    try {
      await fetch(`/api/lessons/${id}/progress/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Failed to create progress:', err);
    }
    router.push(`/lesson_page/?lesson_id=${id}`);
  };

  if (!lesson) return null;

  const { title, description } = lesson.attributes;
  const mainImage = badgeIcon;

  return (
    <div className="lm-overlay" onClick={onClose}>
      <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="lm-close" onClick={onClose}>✕</button>

        <div className="lm-layout">
          {/* Left: Image */}
          <div className="lm-left">
            <div className="lm-imageWrap">
              {mainImage ? (
                <img src={mainImage} alt={title} className="lm-image" />
              ) : (
                <div className="lm-noImage">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Right: Info */}
          <div className="lm-right">
            <div className="lm-rightTop">
              <span className="lm-badgeTag">Lesson</span>
              <h2 className="lm-name">{title}</h2>
              <p className="lm-desc">{description}</p>
            </div>
            <div className="lm-rightBottom">
              <button className="lm-cta" onClick={() => gotoLesson(lesson.id)}>Start Lesson</button>
              <button className="lm-closeBtn" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
