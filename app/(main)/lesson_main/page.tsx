"use client";

import "./lesson_main.css";
import { useEffect, useState } from "react";
import Link from "next/link";

import LessonModal from "../../components/lesson/LessonModal";
import { useUserId } from "@/lib/useauth";

type Lesson = {
  id: string;
  type: string;
  attributes: {
    title: string;
    description: string;
    thumbnail_url: string;
    badge: string;
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
  };
};

interface LessonCardProps {
  lesson: Lesson;
  large?: boolean;
  onClick: () => void;
  progressPercentage?: number;
  remainingChapters?: number;
  submissionNeeded?: boolean;
}

function LessonCard({ lesson, large = false, onClick, progressPercentage, remainingChapters, submissionNeeded }: LessonCardProps) {
  return (
    <div className={`lesson-card ${large ? "large" : ""}`} onClick={onClick}>
      <div
        className="card-image"
        style={{
          backgroundImage: lesson.attributes.thumbnail_url ? `url(${lesson.attributes.thumbnail_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {progressPercentage !== undefined && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
        </div>
      )}

      {submissionNeeded ? (
        <div className="chapters-left">
          badge submission left
        </div>
      ) : remainingChapters !== undefined && (
        <div className="chapters-left">
          {remainingChapters} {remainingChapters === 1 ? "chapter" : "chapters"} left

        </div>
      )}

      <div className="card-content">
        <h3>{lesson.attributes.title}</h3>

        {large && <p>{lesson.attributes.description}</p>}

      </div>
    </div>
  );
}

export default function Home() {
  const userId = useUserId();
  const [mounted, setMounted] = useState(false);
  const [navExpanded, setNavExpanded] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Detect navbar expansion
  useEffect(() => {
    const check = () => setNavExpanded(localStorage.getItem("navbar-expanded") === "true");
    check();
    window.addEventListener("navbar-toggle", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("navbar-toggle", check);
      window.removeEventListener("storage", check);
    };
  }, [mounted]);

  // Mouse wheel horizontal scroll
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
  }, [mounted]);

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, Progress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPage, setAllPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    if (!userId) return;

    async function fetchData() {
      try {
        const [lessonsRes, progressRes] = await Promise.all([
          fetch("/api/lessons"),
          fetch(`/api/lessons/continue/${userId}`),
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

  const latestLessons = [...allLessons].sort((a, b) => {
    const dateA = new Date(a.attributes.created_at).getTime();
    const dateB = new Date(b.attributes.created_at).getTime();
    return dateB - dateA;
  }).slice(0, 3);

  const continueLessons = allLessons.filter(lesson => {
    const progress = progressMap.get(lesson.id);
    if (!progress) return false;
    // Show lessons with remaining chapters OR unsubmitted badge
    return progress.attributes.remainingCount > 0 || !progress.attributes.badgeSubmitted;
  });

  if (!mounted || loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p>Error: {error}</p></div>;

  return (
    <div className="page">
      {/* Main */}
      <main className="main-content">
        {/* Latest */}
        {latestLessons.length > 0 && (
          <section className="section">
            <div className="section-header">
              <div>
                <h2 className="script-title">Latest lesson</h2>
                <p className="subtitle">Freshly made</p>
              </div>
              <Link href="/all_lesson" className="see-all-link">See all lessons</Link>
            </div>

            <div className="horizontal-scroll" style={navExpanded ? { width: "calc(100% - 200px)" } : undefined}>
              {latestLessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  large
                  onClick={() => setSelectedLesson(lesson)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Continue */}
        <section className="section">
          <h2 className="script-title">Continue</h2>

          {continueLessons.length > 0 ? (
            <div className="horizontal-scroll small-cards" style={navExpanded ? { width: "calc(100% - 200px)" } : undefined}>
              {continueLessons.map(lesson => {
                const progress = progressMap.get(lesson.id);
                const percentage = progress ? (progress.attributes.completedCount / progress.attributes.totalChapters) * 100 : 0;
                const remaining = progress ? progress.attributes.totalChapters - progress.attributes.completedCount : 0;
                const needsSubmission = remaining === 0 && !progress?.attributes.badgeSubmitted;
                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onClick={() => setSelectedLesson(lesson)}
                    progressPercentage={percentage}
                    remainingChapters={remaining}
                    submissionNeeded={needsSubmission}
                  />
                );
              })}
            </div>
          ) : (
            <p className="subtitle">No lessons in progress. Start a lesson to continue!</p>
          )}
        </section>

        {/* All lessons */}
        <section className="section">
          <h2 className="normal-title">All lessons</h2>

          {allLessons.length === 0 ? (
            <p className="subtitle">No lessons available.</p>
          ) : (
            <>
              <div className="lesson-grid">
                {allLessons.slice((allPage - 1) * PER_PAGE, allPage * PER_PAGE).map(lesson => (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onClick={() => setSelectedLesson(lesson)}
                  />
                ))}
              </div>

              {allLessons.length > PER_PAGE && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={allPage <= 1}
                  onClick={() => setAllPage(allPage - 1)}
                >‹ Prev</button>
                <span className="page-info">{allPage} / {Math.max(1, Math.ceil(allLessons.length / PER_PAGE))}</span>
                <button
                  className="page-btn"
                  disabled={allPage >= Math.max(1, Math.ceil(allLessons.length / PER_PAGE))}
                  onClick={() => setAllPage(allPage + 1)}
                >Next ›</button>
              </div>
              )}
            </>
          )}
        </section>

        <footer className="main-footer" />
      </main>

      <LessonModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
    </div>
  );
}