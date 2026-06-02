import "./LessonModal.css";
import { useRouter } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { GetUserid } from "@/lib/useauth";


type Chapter = { id: string; type: string };

type Lesson = {
  id: string;
  attributes: {
    title: string;
    description: string;
    thumbnail_url: string;
    badge: string;
  };
  relationships: {
    chapters: {
      data: Chapter[];
    };
  };
};

type Props = {
  lesson: Lesson | null;
  onClose: () => void;
};

export default function LessonModal({ lesson, onClose }: Props) {
  const router = useRouter();

const gotoLesson = (id: string) => {
  router.push(`/lesson_page/?lesson_id=${id}`);
};
  if (!lesson) return null;

  const { title, description, thumbnail_url, badge } = lesson.attributes;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-left">
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="modal-badge">
            <img src="/icon/badge.png" alt="badge" />
            <span>{badge}</span>
          </div>
        </div>
        <div className="modal-right">
          <div
            className="modal-thumbnail"
            style={{
              backgroundImage: thumbnail_url ? `url(${thumbnail_url})` : undefined,
            }}
          />
          <button className="modal-cta" onClick={() => gotoLesson(lesson.id)}>Sign up</button>
        </div>
      </div>
    </div>
  );
}