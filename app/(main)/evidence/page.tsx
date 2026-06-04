"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import EvidenceModal from "../../components/evidence/EvidenceModal";
import "./evidence.css";
import { useUserId } from "@/lib/useauth";

type Lesson = {
  data: {
    id: string;
    attributes: {
      title: string;
      description: string;
      thumbnail_url: string;
      badge: string;
    };
  };
};

type Badge = {
  data: {
    id: string;
    attributes: {
      name: string;
      badge_type: string;
    };
  };
};

type EvidenceRequirement = {
  id: string;
  type: string;
  attributes: {
    description: string;
    examples: string[];
    requirements: string[];
  };
};

export default function Home() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);
  const [evidenceRequirements, setEvidenceRequirements] = useState<EvidenceRequirement | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = useUserId();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson_id");

  // Check if user has completed the lesson before allowing evidence submission
  useEffect(() => {
    if (!lessonId || !userId) return;

    async function checkLessonCompletion() {
      try {
        const res = await fetch(`/api/lessons/continue/${userId}`);
        if (!res.ok) {
          router.push('/all_lesson');
          return;
        }
        const json = await res.json();
        const lessonProgress = (json.data || []).find(
          (p: any) => p.attributes.lessonId === lessonId
        );

        if (!lessonProgress) {
          // No progress for this lesson at all
          router.push('/all_lesson');
          return;
        }

        const { remainingCount } = lessonProgress.attributes;
        if (remainingCount > 0) {
          // Has progress but not completed yet
          router.push(`/lesson_page?lesson_id=${lessonId}`);
        }
      } catch (err) {
        console.error("Failed to check lesson completion:", err);
        router.push('/all_lesson');
      }
    }

    checkLessonCompletion();
  }, [lessonId, userId, router]);

  useEffect(() => {
    if (!lessonId) return;
  fetch(`/api/lessons/${lessonId}`)
      .then((res) => res.json())
      .then((data) => setLesson(data));
  }, [lessonId]);

  useEffect(() => {
    if (!lesson?.data?.attributes?.badge) return;
    const badgeId = lesson.data.attributes.badge;
    console.log(badgeId)

    Promise.all([
      fetch(`/api/badges/${badgeId}`).then((res) => res.json()),
      fetch(`/api/badges/${badgeId}/evidence`).then((res) => res.json())
    ]).then(([badgeData, evidenceData]) => {
      setBadge(badgeData);
      setEvidenceRequirements(evidenceData.data || null);
      console.log(evidenceData)
    }).catch((err) => {
      console.error("Failed to fetch badge or evidence:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, [lesson?.data?.attributes?.badge]);

  if (!userId ) {
    return <div>Please login</div>;
  }

  return (
    <div className="ev-container">
      <div className="ev-main">
        <div className="ev-header">
          <h2 className="ev-title">Evidence Requirements</h2>
          {lesson && (
            <p className="ev-subtitle">
              For: <strong>{lesson.data.attributes.title}</strong>
              {badge && <> &bull; Badge: {badge.data.attributes.name}</>}
            </p>
          )}
        </div>

        {loading ? (
          <div className="ev-loading">Loading evidence requirements...</div>
        ) : evidenceRequirements ? (
          <div className="ev-card">
            <p className="ev-desc">{evidenceRequirements.attributes.description}</p>

            <div className="ev-section">
              <h4>Requirements</h4>
              {evidenceRequirements.attributes.requirements.length > 0 ? (
                <ul>
                  {evidenceRequirements.attributes.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#999", fontSize: "0.9rem", padding: "8px 0" }}>None specified</p>
              )}
            </div>

            <div className="ev-section">
              <h4>Examples</h4>
              {evidenceRequirements.attributes.examples.length > 0 ? (
                <ul>
                  {evidenceRequirements.attributes.examples.map((example, idx) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#999", fontSize: "0.9rem", padding: "8px 0" }}>None provided</p>
              )}
            </div>
            <div className="ev-btnWrap">
              <button className="ev-addBtn" onClick={() => setOpen(true)} disabled={!lesson}>
                + Add Evidence
              </button>
            </div>
          </div>
        ) : (
          <div className="ev-card">
            <p className="ev-desc">Submit your evidence for this badge.</p>
            <div className="ev-section">
              <h4>Requirements</h4>
              <p style={{ color: "#999", fontSize: "0.9rem", padding: "8px 0" }}>None specified</p>
            </div>
            <div className="ev-section">
              <h4>Examples</h4>
              <p style={{ color: "#999", fontSize: "0.9rem", padding: "8px 0" }}>None provided</p>
            </div>
            <div className="ev-btnWrap">
              <button className="ev-addBtn" onClick={() => setOpen(true)} disabled={!lesson}>
                + Add Evidence
              </button>
            </div>
          </div>
        )}
      </div>

      <EvidenceModal
        isOpen={open}
        onClose={() => setOpen(false)}
        badgeId={lesson?.data?.attributes?.badge ?? ""}
        badgeType={badge?.data?.attributes?.badge_type ?? "evidence-backed"}
        badgeName={badge?.data?.attributes?.name}
        lessonName={lesson?.data?.attributes?.title}
      />
    </div>
  );
}
