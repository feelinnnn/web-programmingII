"use client"

import "./all-lessons.css";
import { useEffect, useState } from "react";
import LessonModal from "../../components/lesson/LessonModal";



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

export default function AllLessons() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLessons() {
      try {
        const res = await fetch("/api/lessons");
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const json = await res.json();
        setLessons(json.data);
        console.log(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

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
          />

          <div className="toggle">
            <span>Hide learned lesson</span>
            <div className="switch"></div>
          </div>

          <img src="/icon/filter.png" className="filter" />
        </div>

        {/* Cards */}
        {loading && <p>Loading lessons...</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && (
          <div className="grid">
            {lessons.map((lesson) => (
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