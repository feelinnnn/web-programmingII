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

export default function Home() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);

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
    fetch(`/api/badges/${badgeId}`)
      .then((res) => res.json())
      .then((data) => setBadge(data));
  }, [lesson?.data?.attributes?.badge]);

  if (!userId ) {
    return <div>Please login</div>;
  }

  return (
    <div className="container">

      <div className="content">
        <h2 className="detail-title">Detail</h2>

        <ul className="detail-list">
          <li>evidence 1</li>
          <li>evidence 2</li>
          <li>evidence 3</li>
        </ul>

        <p className="detail-text">
          Mauris vulputate ultrices nisi, ut scelerisque felis ornare eu...
        </p>

        <button
          className="add-btn"
          onClick={() => setOpen(true)}
          disabled={!lesson}
        >
          Add file
        </button>
      </div>

      <EvidenceModal
        isOpen={open}
        onClose={() => setOpen(false)}
        badgeId={lesson?.data?.attributes?.badge ?? ""}
        badgeTypeSnapshot={badge?.data?.attributes?.badge_type ?? "lesson"}
        lessonName={lesson?.data?.attributes?.title}
        badgeName={badge?.data?.attributes?.name}
      />
    </div>
  );
}
