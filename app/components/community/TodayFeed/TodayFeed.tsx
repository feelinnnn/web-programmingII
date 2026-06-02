import styles from './TodayFeed.module.css';
import type { PostApiStructure } from '@/app/(main)/community/page'; 

interface TodayFeedProps {
  posts: PostApiStructure[];
  renderPost: (post: PostApiStructure) => React.ReactNode;
}

export default function TodayFeed({ posts, renderPost }: TodayFeedProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--orange)">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        <span className={styles.label}>Today&apos;s Feed</span>
        <span className={styles.line} />
      </div>

      <div className={styles.list}>
        {posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "gray", padding: "20px" }}>no posts available</p>
        ) : (
          posts.map((post) => renderPost(post))
        )}
      </div>
    </section>
  );
}