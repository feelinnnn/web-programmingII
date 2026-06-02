'use client';

import { useState, useEffect } from 'react';
import { useUserId } from '@/lib/useauth'; 
import './bookmark.css';

// 1. กำหนดชนิดข้อมูลของโพสต์รูปแบบแบน (Flat Structure)
interface FlatBookmarkedPost {
  id: string;
  author: string;
  role: string;
  time: string;
  content: string;
  likes: number;
  comments: number;
  imageUrls: string;
}


function formatTimeAgo(dateString: string | Date): string {
  if (!dateString) return "just now";
  
  // 1. แปลงค่าที่ส่งมาให้เป็นวัตถุ Date อย่างปลอดภัย
  const postDate = new Date(dateString);
  
  // เช็คว่าถ้าแปลงแล้วเป็นวันที่ที่ใช้งานไม่ได้ (Invalid Date) ให้รีเทิร์นข้อความเซฟๆ ไว้ก่อน
  if (isNaN(postDate.getTime())) {
    console.error("Invalid date format received:", dateString);
    return "recently"; 
  }

  const now = new Date();
  
  const seconds = Math.max(0, Math.floor((now.getTime() - postDate.getTime()) / 1000));

  if (seconds < 60) return "just now";
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  // 3. ถ้าเกิน 7 วัน ให้แสดงเป็นวันที่อ่านง่าย เช่น "Jun 2" หรือ "2 มิ.ย."
  return postDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export default function BookmarkPage() {
  // 3. ตั้งชื่อ State ว่า bookmarkedPosts ให้ตรงกับใน JSX ของคุณ
  const [bookmarkedPosts, setBookmarkedPosts] = useState<FlatBookmarkedPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const currentUserId = useUserId() || "";
  // 4. ฟังก์ชันดึงข้อมูลบุ๊กมาร์ก
  const fetchBookmarks = async () => {
    if (!currentUserId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/bookmark/posts?userId=${currentUserId}`);
      const json = await res.json();
      
      if (res.ok && json.success) {
        setBookmarkedPosts(json.data || []);
        console.log(json.data)
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [currentUserId]);

  console.log(bookmarkedPosts)
  if (loading) {
    return <div className="layout-container"><main className="main-content">กำลังโหลดรายการบุ๊กมาร์ก...</main></div>;
  }

  // 5. โครงสร้าง Return ตามที่คุณตกแต่งไว้เป๊ะๆ
  return (
    <div className="layout-container">

      <main className="main-content">
        <div className="bookmark-page">
          <h1 className="page-title">Bookmark</h1>

          <div className="feed-container">
            {bookmarkedPosts.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>ไม่มีรายการบุ๊กมาร์กคั้บ</p>
            ) : (
              bookmarkedPosts.map((post) => (
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
                        {/* 🔑 ครอบฟังก์ชัน formatTimeAgo รอบตัวแปร post.time ตรงนี้ */}
                        <div className="post-meta">{post.role} - {formatTimeAgo(post.time)}</div>
                      </div>
                    </div>
                    <button className="follow-btn">+ Follow</button>
                  </div>

                  <div className="post-body">
                    <p className="post-text" style={{ whiteSpace: 'pre-line' }}>
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
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}