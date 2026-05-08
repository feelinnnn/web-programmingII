"use client";

import Navbar from "../components/Navbar";
import './bookmark.css';

export default function BookmarkPage() {
  const bookmarkedPosts = [
    {
      id: 1,
      author: "Wanilla Pie",
      role: "Home Cook",
      time: "35m ago",
      content: "🍜 ผัดซีอิ๊วหมูกรอบ หอม ๆ ทำง่ายมาก!\nเคล็ดลับของจานนี้คือใช้น้ำมันจากหมูกรอบมาผัด จะช่วยเพิ่มความหอมแบบไม่ต้องปรุงเยอะ เพียงใช้ ...",
      likes: 123,
      comments: 17,
    },
    {
      id: 2,
      author: "Wanilla Pie",
      role: "Home Cook",
      time: "35m ago",
      content: "🍜 ผัดซีอิ๊วหมูกรอบ หอม ๆ ทำง่ายมาก!\nเคล็ดลับของจานนี้คือใช้น้ำมันจากหมูกรอบมาผัด จะช่วยเพิ่มความหอมแบบไม่ต้องปรุงเยอะ เพียงใช้ ...",
      likes: 123,
      comments: 17,
    },
    {
      id: 3,
      author: "Wanilla Pie",
      role: "Home Cook",
      time: "35m ago",
      content: "🍜 ผัดซีอิ๊วหมูกรอบ หอม ๆ ทำง่ายมาก!\nเคล็ดลับของจานนี้คือใช้น้ำมันจากหมูกรอบมาผัด จะช่วยเพิ่มความหอมแบบไม่ต้องปรุงเยอะ เพียงใช้ ...",
      likes: 123,
      comments: 17,
    }
  ];

  return (
    <div className="layout-container">
      <Navbar />

      <main className="main-content">
        <div className="bookmark-page">
          <h1 className="page-title">Bookmark</h1>

          <div className="feed-container">
            {bookmarkedPosts.map((post) => (
              <div key={post.id} className="post-card">
                
                <div className="post-header">
                  <div className="user-info">
                    <div className="avatar-placeholder">
                      <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="user-details">
                      <div className="author-name">{post.author}</div>
                      <div className="post-meta">{post.role} - {post.time}</div>
                    </div>
                  </div>
                  <button className="follow-btn">+ Follow</button>
                </div>

                <div className="post-body">
                  <p className="post-text">
                    {post.content} <span className="see-more">See more</span>
                  </p>
                </div>

                <div className="post-image-placeholder"></div>

                <div className="post-actions">
                  <button className="action-btn">
                    <span className="icon">♡</span> {post.likes}
                  </button>
                  <span className="divider">|</span>
                  <button className="action-btn">
                    <span className="icon">💬</span> {post.comments}
                  </button>
                  <span className="divider">|</span>
                  <button className="action-btn bookmark-active">
                    <span className="icon">🔖</span> Bookmark
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}