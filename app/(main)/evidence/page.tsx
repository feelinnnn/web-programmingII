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
    <div className="container">

      <div className="content">
        <div style={{ marginBottom: "30px" }}>
          <h2 className="detail-title">Evidence Requirements</h2>
          {lesson && (
            <p style={{
              color: "#666",
              fontSize: "0.95rem",
              marginTop: "10px"
            }}>
              For: <strong>{lesson.data.attributes.title}</strong>
              
              {badge && ` • Badge: ${badge.data.attributes.name}`}
            </p>
          )}
        </div>

        {loading ? (
          <div style={{
            padding: "40px",
            textAlign: "center",
            background: "white",
            borderRadius: "16px",
            marginBottom: "20px"
          }}>
            <p style={{ color: "#999", fontSize: "1.1rem" }}>⏳ Loading evidence requirements...</p>
          </div>
        ) : evidenceRequirements ? (
          <div className="evidence-item">
            <p className="evidence-description">{evidenceRequirements.attributes.description}</p>

            {evidenceRequirements.attributes.requirements.length > 0 && (
              <div className="evidence-requirements-list">
                <h4>Requirements:</h4>
                <ul>
                  {evidenceRequirements.attributes.requirements.map((req, idx) => (
                    <li key={idx}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {evidenceRequirements.attributes.examples.length > 0 && (
              <div className="evidence-examples">
                <h4>Examples:</h4>
                <ul>
                  {evidenceRequirements.attributes.examples.map((example, idx) => (
                    <li key={idx}>{example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="detail-text">
            ℹ️ No specific evidence requirements defined for this badge yet.
          </p>
        )}

        <button
          className="add-btn"
          onClick={() => setOpen(true)}
          disabled={!lesson}
        >
          ➕ Add File
        </button>
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
