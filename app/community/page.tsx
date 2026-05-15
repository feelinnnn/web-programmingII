'use client';

import { useState } from 'react';
// Import Navbar โดยถอยออกจาก folder community และ app ไปหา components
import Navbar from '../components/Navbar';
import '../components/Navbar.css';

// Import Components อื่นๆ (แก้ path ให้ถอยไปหาโฟลเดอร์ components ข้างนอก)
import SearchBar from '../components/SearchBar/SearchBar';
import CreatePost from '../components/CreatePost/CreatePost';
import TodayFeed from '../components/TodayFeed/TodayFeed';
import PopularHashtags from '../components/PopularHashtags/PopularHashtags';
import PopularCreations from '../components/PopularCreations/PopularCreations';

// Import Types
import type { Post } from '../components/TodayFeed/TodayFeed';
import type { Hashtag } from '../components/PopularHashtags/PopularHashtags';
import type { Creator } from '../components/PopularCreations/PopularCreations';

import styles from './page.module.css';

// Mock Data
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'Wanilla Pie',
    role: 'Home Cook',
    timeAgo: '35m ago',
    content: '🍖 ผัดซี่โครงหมูทรอม หอม ๆ ทำจ่ายมาก!\nเคล็ดลับของจานนี้คือใช้น้ำมันจากหมูกรอบมาผัด จะช่วยเพิ่มความหอมแบบไม่ต้องปรุงเลยะ เพียงใช้...',
    likes: 123,
    comments: 17,
  },
  {
    id: '2',
    author: 'Pawarit',
    role: 'Pastry Chef',
    timeAgo: '1hrs ago',
    content: 'ทาร์ตสตรอว์เบอร์รีครีมสด\nแป้งทาร์ตกรอบหอมเนย ตัดกับครีมสดเนียนนุ่ม และสตรอว์เบอร์รีสดหวานอมเปรี้ยว เคล็ดลับอยู่ที่...',
    likes: 98,
    comments: 12,
  },
];

const MOCK_HASHTAGS: Hashtag[] = [
  { rank: 1, tag: '#ผัดไทย', posts: 1203, hot: true },
  { rank: 2, tag: '#เบเกอรี่', posts: 806 },
  { rank: 3, tag: '#คุกกี้', posts: 789 },
  { rank: 4, tag: '#อาหารคลีน', posts: 675 },
  { rank: 5, tag: '#สูตรลับ', posts: 517 },
];

const MOCK_CREATORS: Creator[] = [
  {
    id: '1',
    name: 'Wanilla Pie',
    role: 'Home Cook',
    followers: '2.1K',
    images: [{ likes: 507 }, { likes: 345 }],
  },
  {
    id: '2',
    name: 'Nana Seed',
    role: 'Street Food',
    followers: '4.7K',
    images: [{ likes: 509 }, { likes: 187 }],
  },
  {
    id: '3',
    name: 'Mali Bakery',
    role: 'Pastry Chef',
    followers: '3.2K',
    images: [{ likes: 396 }, { likes: 582 }],
  },
];

export default function CommunityFeedPage() {
  // สร้าง state เพื่อให้เนื้อหาขยับตามการ หด/กาง ของ Navbar
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#FFF2D7' }}>
      
      {/* 1. ส่วน Navbar (อยู่ซ้ายสุด) */}
      {/* ส่งฟังก์ชันไปให้ Navbar ถ้าต้องการให้กดปุ่มแล้ว IsExpanded เปลี่ยนค่า */}
      <Navbar /> 

      {/* 2. ส่วนเนื้อหาหลัก (Page Content) */}
      <div 
        style={{ 
          flexGrow: 1, 
          marginLeft: isExpanded ? '280px' : '80px', // ดันเนื้อหาตามขนาด Navbar
          transition: 'margin-left 0.3s ease' 
        }}
      >
        <div className={styles.page}>
          {/* Center Column */}
          <div className={styles.main}>
            {/* Top Bar */}
            <div className={styles.topBar}>
              <h1 className={styles.pageTitle}>
                <span className={styles.titleBold}>Community</span>{' '}
                <span className={styles.titleScript}>Feed</span>
              </h1>
              <SearchBar />
            </div>

            {/* Create Post */}
            <CreatePost />

            {/* Feed */}
            <TodayFeed
              posts={MOCK_POSTS}
              renderPost={(post) => (
                <div key={post.id} className={styles.postCardCustom}>
                   <div style={{ marginBottom: '10px' }}>
                      <strong>{post.author}</strong> • <small>{post.role}</small>
                   </div>
                   <p style={{ whiteSpace: 'pre-line' }}>{post.content}</p>
                   <div style={{ marginTop: '10px', color: '#666' }}>
                      ❤️ {post.likes}  💬 {post.comments}
                   </div>
                </div>
              )}
            />
          </div>

          {/* Right Sidebar */}
          <aside className={styles.sidebar}>
            <PopularHashtags hashtags={MOCK_HASHTAGS} />
            <PopularCreations creators={MOCK_CREATORS} />
          </aside>
        </div>
      </div>
    </div>
  );
}