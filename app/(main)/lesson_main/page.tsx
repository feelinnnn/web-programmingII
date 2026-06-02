"use client";

import "./lesson_main.css";
import { useEffect, useState } from "react";
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
  };
};

interface LessonCardProps {
  lesson: Lesson;
  large?: boolean;
  onClick: () => void;
  progressPercentage?: number;
  remainingChapters?: number;
}

function LessonCard({ lesson, large = false, onClick, progressPercentage, remainingChapters }: LessonCardProps) {
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

      {remainingChapters !== undefined && (
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
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, Progress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const remaining = progress.attributes.totalChapters - progress.attributes.completedCount;
    return remaining > 0;
  });

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p>Error: {error}</p></div>;

  return (
    <div className="page">
      {/* Main */}
      <main className="main-content">
        {/* Latest */}
        {latestLessons.length > 0 && (
          <section className="section">
            <h2 className="script-title">Latest lesson</h2>
            <p className="subtitle">Freshly made</p>

            <div className="horizontal-scroll">
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
        {continueLessons.length > 0 && (
          <section className="section">
            <h2 className="script-title">Continue</h2>

            <div className="horizontal-scroll small-cards">
              {continueLessons.map(lesson => {
                const progress = progressMap.get(lesson.id);
                const percentage = progress ? (progress.attributes.completedCount / progress.attributes.totalChapters) * 100 : 0;
                const remaining = progress ? progress.attributes.totalChapters - progress.attributes.completedCount : 0;
                return (
                  <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    onClick={() => setSelectedLesson(lesson)}
                    progressPercentage={percentage}
                    remainingChapters={remaining}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* All lessons */}
        {allLessons.length > 0 && (
          <section className="section">
            <h2 className="normal-title">All lessons</h2>

            <div className="lesson-grid">
              {allLessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => setSelectedLesson(lesson)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="footer">
          <button className="lang-btn">ดูหลักสูตรทั้งหมด</button>

          <div className="footer-line" />
        </footer>
      </main>

      <LessonModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
    </div>
  );
}