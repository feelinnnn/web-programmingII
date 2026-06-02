"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import EvidenceModal from "../../components/EvidenceModal";
import "./evidence.css";
import { GetUserid } from "@/lib/useauth";

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
  const [open, setOpen] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [badge, setBadge] = useState<Badge | null>(null);

  const userId = GetUserid();
  const searchParams = useSearchParams();
  const lessonId = searchParams.get("lesson_id");

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
        <h2 className="text-3xl font-bold mb-6">Detail</h2>

        <ul className="list-disc pl-6 space-y-2 mb-6 text-lg">
          <li>evidence 1</li>
          <li>evidence 2</li>
          <li>evidence 3</li>
        </ul>

        <p className="text-base leading-7 mb-8">
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
