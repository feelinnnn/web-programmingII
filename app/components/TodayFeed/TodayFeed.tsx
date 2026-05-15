import styles from './TodayFeed.module.css';

// PostCard type — replace 
export interface Post {
  id: string;
  author: string;
  role: string;
  timeAgo: string;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  isFollowing?: boolean;
}

interface TodayFeedProps {
  posts: Post[];
  // Replace own PostCard component
  renderPost: (post: Post) => React.ReactNode;
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
        {posts.map((post) => renderPost(post))}
      </div>
    </section>
  );
}
