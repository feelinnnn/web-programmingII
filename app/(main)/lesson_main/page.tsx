"use client";

import "./lesson_main.css";
import { useEffect, useState } from "react";
import Link from "next/link";

import LessonModal from "../../components/lesson/LessonModal";
import { useUserId } from "@/lib/useauth";

type BadgeInfo = {
  id: string;
  name: string;
  description: string;
  badge_type: string;
  icon_url: string | null;
};

type Lesson = {
  id: string;
  type: string;
  attributes: {
    title: string;
    description: string;
    thumbnail_url: string;
    badge: BadgeInfo | null;
    created_at: string;
  };
  relationships: {
    chapters: {
      links: { related: string };
      data: { id: string; type: string }[];
    };
  };
};

type Progress = {
  id: string;
  attributes: {
    lessonId: string;
    completedCount: number;
    totalChapters: number;
    remainingCount: number;
    badgeSubmitted?: boolean;
    badge: BadgeInfo | null;
    lesson: { id: string; title: string; thumbnail_url: string } | null;
  };
};

interface LessonCardProps {
  lesson: Lesson;
  large?: boolean;
  onClick: () => void;
  progressPercentage?: number;
  remainingChapters?: number;
  submissionNeeded?: boolean;
  badgeType?: string;
}

function getBadgeColor(badgeType?: string): string {
  switch (badgeType) {
    case "self-declared":    return "#A0D585";
    case "evidence-backed":  return "#FFA95A";
    case "expert-certified": return "#FF5A5A";
    case "lesson":
    default:                 return "#FFD45A";
  }
}

function LessonCard({
  lesson,
  large = false,
  onClick,
  progressPercentage,
  remainingChapters,
  submissionNeeded,
  badgeType,
}: LessonCardProps) {
  const badgeColor = getBadgeColor(badgeType);

  return (
    <div className={`lesson-card${large ? " large" : ""}`} onClick={onClick}>
      <div className="card-image-area">
        {lesson.attributes.thumbnail_url && (
          <img
            src={lesson.attributes.thumbnail_url}
            alt={lesson.attributes.title}
            className="card-thumbnail"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <span className="card-badge-pill" style={{ backgroundColor: badgeColor, color: "#333" }}>
          Badge
        </span>
        {!large && <div className="card-label">{lesson.attributes.title}</div>}
      </div>

      {large && (
        <div className="card-content">
          <h3>{lesson.attributes.title}</h3>
          <p>{lesson.attributes.description}</p>
        </div>
      )}

      {progressPercentage !== undefined && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
        </div>
      )}

      {submissionNeeded ? (
        <div className="chapters-left">badge submission left</div>
      ) : (
        remainingChapters !== undefined && (
          <div className="chapters-left">
            {remainingChapters} {remainingChapters === 1 ? "chapter" : "chapters"} left
          </div>
        )
      )}
    </div>
  );
}

export default function Home() {
  const userId = useUserId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, Progress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mouse wheel → horizontal scroll on .horizontal-scroll
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const scroll = target.closest(".horizontal-scroll") as HTMLElement | null;
      if (scroll && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        scroll.scrollLeft += e.deltaY;
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    if (!userId) return;
    async function fetchData() {
      try {
        const [lessonsRes, progressRes] = await Promise.all([
          fetch("/api/lessons/with-badges"),
          fetch(`/api/lessons/continue/${userId}/with-badges`),
        ]);
        if (!lessonsRes.ok) throw new Error("Failed to fetch lessons");
        const lessonsJson = await lessonsRes.json();
        setAllLessons(lessonsJson.data || []);

        if (progressRes.ok) {
          const progressJson = await progressRes.json();
          const map = new Map<string, Progress>();
          (progressJson.data || []).forEach((p: Progress) => {
            map.set(p.attributes.lessonId, p);
          });
          setProgressMap(map);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId]);


  const latestLessons = [...allLessons]
    .sort((a, b) =>
      new Date(b.attributes.created_at).getTime() -
      new Date(a.attributes.created_at).getTime()
    )
    .slice(0, 5);

  const continueLessons = allLessons.filter((lesson) => {
    const progress = progressMap.get(lesson.id);
    if (!progress) return false;
    return progress.attributes.remainingCount > 0 || !progress.attributes.badgeSubmitted;
  });

  if (!mounted || loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p>Error: {error}</p></div>;

  return (
    <div className="page">
      <main className="main-content">

        {/* Latest Lessons — horizontal scroll row */}
        {latestLessons.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="script-title">Latest lesson</h2>
              <div className="subtitle-row">
                <p className="subtitle">Freshly made</p>
                <Link href="/all_lesson" className="see-all-link">See all lessons</Link>
              </div>
            </div>

            <div className="horizontal-scroll">
              {latestLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  large
                  onClick={() => setSelectedLesson(lesson)}
                  badgeType={lesson.attributes.badge?.badge_type}
                />
              ))}
            </div>
          </section>
        )}

        {/* Continue — horizontal scroll */}
        <section className="section">
          <h2 className="script-title">Continue</h2>

          {continueLessons.length > 0 ? (
            <div className="horizontal-scroll">
              {continueLessons.map((lesson) => {
                const progress = progressMap.get(lesson.id);
                const percentage = progress
                  ? (progress.attributes.completedCount / progress.attributes.totalChapters) * 100
                  : 0;
                const remaining = progress
                  ? progress.attributes.totalChapters - progress.attributes.completedCount
                  : 0;
                const needsSubmission = remaining === 0 && !progress?.attributes.badgeSubmitted;

                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onClick={() => setSelectedLesson(lesson)}
                    progressPercentage={percentage}
                    remainingChapters={remaining}
                    submissionNeeded={needsSubmission}
                    badgeType={lesson.attributes.badge?.badge_type}
                  />
                );
              })}
            </div>
          ) : (
            <p className="subtitle">No lessons in progress. Start a lesson to continue!</p>
          )}
        </section>

        <div className="main-footer" />
      </main>

      <LessonModal lesson={selectedLesson}  onClose={() => setSelectedLesson(null)} />
    </div>
  );
}