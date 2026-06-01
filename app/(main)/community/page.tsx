'use client';

import SearchBar from '../../components/community/SearchBar/SearchBar';
import CreatePost from '../../components/community/CreatePost/CreatePost';
import TodayFeed from '../../components/community/TodayFeed/TodayFeed';
import PopularHashtags from '../../components/community/PopularHashtags/PopularHashtags';
import PopularCreations from '../../components/community/PopularCreations/PopularCreations';

import type { Post } from '../../components/community/TodayFeed/TodayFeed';
import type { Hashtag } from '../../components/community/PopularHashtags/PopularHashtags';
import type { Creator } from '../../components/community/PopularCreations/PopularCreations';

import styles from './page.module.css';

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
  return (
    <div className={styles.page}>
      
      <div className={styles.main}>
        {/* Top Bar */}
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>
            <span className={styles.titleBold}>Community</span>{' '}
            <span className={styles.titleScript}>Feed</span>
          </h1>
          <SearchBar />
        </div>

        <CreatePost />

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

      <aside className={styles.sidebar}>
        <PopularHashtags hashtags={MOCK_HASHTAGS} />
        <PopularCreations creators={MOCK_CREATORS} />
      </aside>

    </div>
  );
}