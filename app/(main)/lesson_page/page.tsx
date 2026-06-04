"use client"
import "./lesson-page.css";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useUserId } from "@/lib/useauth";



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

type BadgeInfo = {
  id: string;
  name: string;
  badge_type: string;
  icon_url: string | null;
};

type Lesson = {
  id: string;
  attributes: {
    title: string;
    description: string;
    thumbnail_url: string;
    badge?: BadgeInfo | null;
  };
};

export default function LessonPage() {
  const router = useRouter();
  const userId = useUserId();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
  const [allowedChapters, setAllowedChapters] = useState<Set<string>>(new Set());
  const [canAccessSubmission, setCanAccessSubmission] = useState(false);
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const [submittingChapter, setSubmittingChapter] = useState<string | null>(null);
  const [badgeType, setBadgeType] = useState<string | null>(null);

  // Check if user has access to this lesson (must have progress in it)
  useEffect(() => {
    if (!lessonId || !userId) return;

    async function checkAccess() {
      try {
        const res = await fetch(`/api/lessons/continue/${userId}/with-badges`);
        if (!res.ok) {
          router.push('/all_lesson');
          return;
        }
        const json = await res.json();
        const hasProgress = (json.data || []).some(
          (p: any) => p.attributes.lessonId === lessonId
        );
        if (!hasProgress) {
          router.push('/all_lesson');
        }
      } catch (err) {
        console.error("Failed to check lesson access:", err);
        router.push('/all_lesson');
      }
    }

    checkAccess();
  }, [lessonId, userId, router]);

  useEffect(() => {
    if (!lessonId || !userId) return;

    async function fetchData() {
      try {
        const [lessonRes, chaptersRes, progressRes] = await Promise.all([
          fetch(`/api/lessons/${lessonId}/with-badge`),
          fetch(`/api/lessons/${lessonId}/chapters`),
          fetch(`/api/lessons/continue/${userId}/with-badges`),
        ]);

        if (!lessonRes.ok) throw new Error("Failed to fetch lesson");
        if (!chaptersRes.ok) throw new Error("Failed to fetch chapters");

        const lessonJson = await lessonRes.json();
        const chaptersJson = await chaptersRes.json();

        const sortedChapters: Chapter[] = chaptersJson.data.sort(
          (a: Chapter, b: Chapter) => a.attributes.order - b.attributes.order
        );

        setLesson(lessonJson.data);
        setBadgeType(lessonJson.data.attributes.badge?.badge_type ?? null);

        setChapters(sortedChapters);
        setSelectedChapter(sortedChapters[0] ?? null);

        // Handle progress
        if (progressRes.ok) {
          const progressJson = await progressRes.json();
          const lessonProgress = progressJson.data?.find(
            (p: any) => p.attributes.lessonId === lessonId
          );

          if (lessonProgress) {
            const { completedCount, remainingCount } = lessonProgress.attributes;
            const completedIds = new Set<string>(
              lessonProgress.relationships.completedChapters.data.map((c: any) => c.id)
            );
            setCompletedChapters(completedIds);

            const allowed = new Set<string>();

            if (completedCount === 0) {
              // Only allow first chapter
              if (sortedChapters.length > 0) {
                allowed.add(sortedChapters[0].id);
              }
            } else if (remainingCount === 0) {
              // Allow all chapters
              sortedChapters.forEach(ch => allowed.add(ch.id));
              setCanAccessSubmission(true);
            } else {
              // Allow completed chapters and next incomplete chapter
              sortedChapters.forEach((ch) => {
                if (completedIds.has(ch.id)) {
                  allowed.add(ch.id);
                } else if (allowed.size === completedCount) {
                  // Add the next incomplete chapter
                  allowed.add(ch.id);
                }
              });
            }

            setAllowedChapters(allowed);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lessonId, userId]);

  const handleChapterClick = (chapter: Chapter) => {
    if (!allowedChapters.has(chapter.id)) {
      alert("You can't access this chapter yet. Complete the previous chapters first.");
      return;
    }
    setSelectedChapter(chapter);
  };

  const handleChapterSubmit = async () => {
    if (!selectedChapter || !lessonId) return;
    if (completedChapters.has(selectedChapter.id)) {
      alert("You have already completed this chapter.");
      return;
    }

    setSubmittingChapter(selectedChapter.id);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/progress/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        await res.json();

        const newCompletedChapters = new Set([...completedChapters, selectedChapter.id]);
        setCompletedChapters(newCompletedChapters);

        // Recalculate allowed chapters
        const newAllowed = new Set<string>();
        const newCompletedCount = newCompletedChapters.size;

        if (newCompletedCount === chapters.length) {
          // All chapters completed - allow all chapters and submission
          chapters.forEach(ch => newAllowed.add(ch.id));
          setCanAccessSubmission(true);

          // For "lesson" badge type, auto-grant badge when all chapters are complete
          if (badgeType === "lesson") {
            await grantBadge(true);
          }
        } else {
          // Allow completed chapters and next incomplete chapter
          chapters.forEach((ch) => {
            if (newCompletedChapters.has(ch.id)) {
              newAllowed.add(ch.id);
            } else if (newAllowed.size === newCompletedCount) {
              newAllowed.add(ch.id);
            }
          });
        }

        setAllowedChapters(newAllowed);
        alert("Chapter completed! Moving to the next chapter...");

        // Move to next chapter
        const currentIndex = chapters.findIndex(ch => ch.id === selectedChapter.id);
        if (currentIndex < chapters.length - 1) {
          setSelectedChapter(chapters[currentIndex + 1]);
        }
      } else {
        alert("Failed to submit chapter. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting chapter:", err);
      alert("Error submitting chapter. Please try again.");
    } finally {
      setSubmittingChapter(null);
    }
  };

  const grantBadge = async (silent = true) => {
    if (!lesson || !badgeType) return;

    try {
      const badgeId = lesson.attributes.badge?.id;
      await fetch('/api/user-badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            attributes: {
              userId,
              badgeId,
              badgeTypeSnapshot: badgeType,
              userNote: null,
              evidenceUrls: [],
            }
          }
        })
      });

      if (!silent) {
        alert("Badge granted! You have completed this lesson.");
      }
    } catch (err) {
      console.error("Error granting badge:", err);
    }
  };

  const handleSubmitClick = () => {
    if (!canAccessSubmission) {
      alert("You can't submit yet. Complete all chapters first.");
      return;
    }
    gotoEvidence();
  };

  if (!mounted || loading) return <div className="page"><p>Loading...</p></div>;
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
            {selectedChapter ? (
              <>
                {lesson?.attributes.badge?.badge_type !== "lesson" && (
                  <button
                    className="submit-btn"
                    onClick={() => handleChapterSubmit()}
                    disabled={submittingChapter === selectedChapter.id || completedChapters.has(selectedChapter.id)}
                  >
                    {submittingChapter === selectedChapter.id ? "Submitting..." : completedChapters.has(selectedChapter.id) ? "Completed" : "Submit Chapter"}
                  </button>
                )}
                {selectedChapter && chapters.length > 0 && chapters[chapters.length - 1].id === selectedChapter.id &&  badgeType !== "lesson" &&(
                  <button className="submit-btn" onClick={handleSubmitClick} style={{ marginLeft: "10px" }}>
                    Submit Evidence
                  </button>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Episode Sidebar */}
      <div className="episode-sidebar">
        {chapters.map((chapter, i) => {
          const isAllowed = allowedChapters.has(chapter.id);
          return (
            <div key={chapter.id} onClick={() => handleChapterClick(chapter)} style={{ opacity: isAllowed ? 1 : 0.5, cursor: isAllowed ? "pointer" : "not-allowed" }}>
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
          );
        })}
        
        
         {badgeType !== "lesson" && (

           <div onClick={handleSubmitClick} style={{ opacity: canAccessSubmission ? 1 : 0.5, cursor: canAccessSubmission ? "pointer" : "not-allowed" }}>
        <div className="connector" />  
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
         )}
      </div>
    </div>
  );
}