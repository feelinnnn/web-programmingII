"use client";

import './Postcard.module.css';

interface Props {
  id: number;
  author: string;
  role: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
}

export default function PostCard({author, role, time, content, likes, comments,}: Props) {
  return (
    <div className="post-card">

      <div className="post-header">
        <div className="user-info">
          <div className="avatar-placeholder">
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div className="user-details">
            <div className="author-name">{author}</div>
            <div className="post-meta">{role} - {time}</div>
          </div>
        </div>
        <button className="follow-btn">+ Follow</button>
      </div>

      <div className="post-body">
        <p className="post-text">
          {content} <span className="see-more">See more</span>
        </p>
      </div>

      <div className="post-image-placeholder"></div>

      <div className="post-actions">
        <button className="action-btn">
          <span className="icon">♡</span> {likes}
        </button>
        <span className="divider">|</span>
        <button className="action-btn">
          <span className="icon">💬</span> {comments}
        </button>
        <span className="divider">|</span>
        <button className="action-btn bookmark-active">
          <span className="icon">🔖</span> Bookmark
        </button>
      </div>
    </div>
  );
}
