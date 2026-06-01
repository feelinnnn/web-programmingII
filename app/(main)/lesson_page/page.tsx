"use client"
import "./lesson-page.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";



type EpisodeType = "video" | "document";

type Chapter = {
  id: string;
  type: string;
  attributes: {
    title: string;
    content: string;
    videoUrl: string;
    type: EpisodeType;
    order: number;
  };
};

type Lesson = {
  id: string;
  attributes: {
    title: string;
    description: string;
    thumbnail_url: string;
  };
};

export default function LessonPage() {
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson_id");
  const gotoEvidence = () => {
  router.push(`/evidence/?lesson_id=${lessonId}`);
  };

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonId) return;

    async function fetchData() {
      try {
        const [lessonRes, chaptersRes] = await Promise.all([
          fetch(`/api/lessons/${lessonId}`),
          fetch(`/api/lessons/${lessonId}/chapters`),
        ]);

        if (!lessonRes.ok) throw new Error("Failed to fetch lesson");
        if (!chaptersRes.ok) throw new Error("Failed to fetch chapters");

        const lessonJson = await lessonRes.json();
        const chaptersJson = await chaptersRes.json();

        const sortedChapters: Chapter[] = chaptersJson.data.sort(
          (a: Chapter, b: Chapter) => a.attributes.order - b.attributes.order
        );

        setLesson(lessonJson.data);
        setChapters(sortedChapters);
        setSelectedChapter(sortedChapters[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lessonId]);

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p>Error: {error}</p></div>;

  return (
    <div className="page">

      {/* Main Content */}
      <div className="main">
        <div className="content-card">
          {/* Video Player */}
          {selectedChapter?.attributes.type === "video" ? (
             <iframe
              className="video-player"
              src={selectedChapter.attributes.videoUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="video-player">
              <div className="play-button">
                <img src="/icon/play-icon.png" alt="Play" />
              </div>
            </div>
          )}

          {/* Info */}
          <h2 className="video-title">
            {selectedChapter?.attributes.title ?? lesson?.attributes.title}
          </h2>
          <p className="video-description">
            {selectedChapter?.attributes.content ?? lesson?.attributes.description}
          </p>

          <div className="submit-row">
            <button className="submit-btn">Submit</button>
          </div>
        </div>
      </div>

      {/* Episode Sidebar */}
      <div className="episode-sidebar">
        {chapters.map((chapter, i) => (
          <div key={chapter.id} onClick={() => setSelectedChapter(chapter)}>
            <div className={`episode-item ${selectedChapter?.id === chapter.id ? "active" : ""}`}>
              <div className="episode-icon">
                <img
                  src={chapter.attributes.type === "video" ? "/icon/video-icon.png" : "/icon/doc-icon.png"}
                  alt={chapter.attributes.type}
                />
              </div>
              <span className="episode-title">{chapter.attributes.title}</span>
            </div>
            {i < chapters.length - 1 && <div className="connector" />}
          </div>
        ))}
        <div className="connector" />
        
         <div onClick={() => gotoEvidence()}>
            <div className={`episode-item ${selectedChapter ? "active" : ""}`}>
              <div className="episode-icon">
                <img
                  src={"/icon/doc-icon.png"}
                  alt={"submission"}
                />
              </div>
              <span className="episode-title">{"Submission"}</span>
            </div>
          </div>
      </div>
    </div>
  );
}