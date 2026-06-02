"use client"

import "./all-lessons.css";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, LessonProgress>>(new Map());
  const [searchTerm, setSearchTerm] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  // const [filterBadgeType, setFilterBadgeType] = useState<string | null>(null);
  // const [showFilterModal, setShowFilterModal] = useState(false);
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
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        lesson.attributes.title.toLowerCase().includes(searchLower) ||
        lesson.attributes.description.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Hide completed filter
    if (hideCompleted) {
      const progress = progressMap.get(lesson.id);
      if (progress) {
        const remaining = progress.attributes.totalChapters - progress.attributes.completedCount;
        if (remaining === 0) return false;
      }
    }

    // // Badge type filter
    // if (filterBadgeType) {
    //   if (lesson.attributes.badge !== filterBadgeType) return false;
    // }

    return true;
  });

  // const badgeTypes = ["self-declared", "evidence-backed", "expert-certified", "lesson"];

  if (!mounted) return null;

  return (
    <div className="page">
      {/* Sidebar */}

      {/* Main Content */}
      <div className="main">
        {/* Top Bar */}
        <div className="topbar">
          <input
            type="text"
            placeholder="Search"
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="toggle">
            <span>Hide completed lesson</span>
            <div
              className={`switch ${hideCompleted ? "active" : ""}`}
              onClick={() => setHideCompleted(!hideCompleted)}
            />
          </div>

          {/* Filter commented out
          <div style={{ position: "relative" }} className="filtercontainer">
            <img
              src="/icon/filter.png"
              className={`filter ${filterBadgeType ? "active" : ""}`}
              onClick={() => setShowFilterModal(!showFilterModal)}
              style={{ cursor: "pointer",
                      maxHeight : 55
              }}
            />
            {showFilterModal && (
              <div className="filter-modal">
                <div
                  className="filter-option"
                  onClick={() => {
                    setFilterBadgeType(null);
                    setShowFilterModal(false);
                  }}
                >
                  Clear filter
                </div>
                {badgeTypes.map(type => (
                  <div
                    key={type}
                    className={`filter-option ${filterBadgeType === type ? "selected" : ""}`}
                    onClick={() => {
                      setFilterBadgeType(type);
                      setShowFilterModal(false);
                    }}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>
          */}
        </div>

        {/* Result Count */}
        {!loading && !error && (
          <div className="result-count">
            Showing {filteredLessons.length} lesson{filteredLessons.length !== 1 ? "s" : ""}
            {hideCompleted && progressMap.size > 0 && (
              <span> (learned lessons hidden)</span>
            )}
          </div>
        )}

        {/* Cards */}
        {loading && <p>Loading lessons...</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && filteredLessons.length === 0 && (
          <p className="no-results">No lessons found</p>
        )}

        {!loading && !error && filteredLessons.length > 0 && (
          <div className="grid">
            {filteredLessons.map((lesson) => (
              <div className="card" key={lesson.id} onClick={() => setSelectedLesson(lesson)}>
                <div
                    className="card-top"
                    style={{
                      backgroundImage: `url(${lesson.attributes.thumbnail_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                <div className="card-bottom">
                  <p>{lesson.attributes.title}</p>
                  <span>→</span>
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