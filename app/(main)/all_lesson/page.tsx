"use client"

import "./all-lessons.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type LessonProgress = {
  id: string;
  attributes: {
    lessonId: string;
    completedCount: number;
    totalChapters: number;
  };
};

export default function AllLessons() {
  const userId = useUserId();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, LessonProgress>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch("/api/lessons");
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const json = await res.json();
        setLessons(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchLessons();
  }, []);

  useEffect(() => {
    if (!userId) return;
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/lessons/continue/${userId}`);
        if (res.ok) {
          const json = await res.json();
          const map = new Map<string, LessonProgress>();
          (json.data || []).forEach((progress: LessonProgress) => {
            map.set(progress.attributes.lessonId, progress);
          });
          setProgressMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    }
    fetchProgress();
  }, [userId]);

  const filteredLessons = lessons.filter(lesson => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        lesson.attributes.title.toLowerCase().includes(searchLower) ||
        lesson.attributes.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (hideCompleted) {
      const progress = progressMap.get(lesson.id);
      if (progress) {
        const remaining = progress.attributes.totalChapters - progress.attributes.completedCount;
        if (remaining === 0) return false;
      }
    }
    return true;
  });

  if (!mounted) return null;

  return (
    <div className="al-page">
      <div className="al-main">
        {/* Back + Title */}
        <div className="al-header">
          <button className="al-backBtn" onClick={() => router.back()}>← Back</button>
        </div>
        <h1 className="al-title">All Lessons</h1>

        {/* Top Bar */}
        <div className="al-topbar">
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="al-search"
          />
          <div className="al-toggle">
            <span>Hide completed</span>
            <div
              className={`al-switch ${hideCompleted ? "active" : ""}`}
              onClick={() => setHideCompleted(!hideCompleted)}
            />
          </div>
        </div>

        {/* Result Count */}
        {!loading && !error && (
          <div className="al-resultCount">
            Showing {filteredLessons.length} lesson{filteredLessons.length !== 1 ? "s" : ""}
            {hideCompleted && <span> (completed hidden)</span>}
          </div>
        )}

        {/* Cards */}
        {loading && <p className="al-status">Loading lessons...</p>}
        {error && <p className="al-error">Error: {error}</p>}
        {!loading && !error && filteredLessons.length === 0 && (
          <p className="al-status">No lessons found</p>
        )}

        {!loading && !error && filteredLessons.length > 0 && (
          <div className="al-grid">
            {filteredLessons.map((lesson) => (
              <div className="al-card" key={lesson.id} onClick={() => setSelectedLesson(lesson)}>
                <div className="al-cardImage">
                  <div
                    className="al-cardThumb"
                    style={{
                      backgroundImage: lesson.attributes.thumbnail_url ? `url(${lesson.attributes.thumbnail_url})` : undefined,
                    }}
                  />
                  <div className="al-cardLabel">{lesson.attributes.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <LessonModal lesson={selectedLesson} onClose={() => setSelectedLesson(null)} />
    </div>
  );
}
