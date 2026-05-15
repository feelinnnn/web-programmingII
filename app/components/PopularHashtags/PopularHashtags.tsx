import styles from './PopularHashtags.module.css';

export interface Hashtag {
  rank: number;
  tag: string;
  posts: number;
  hot?: boolean;
}

interface PopularHashtagsProps {
  hashtags: Hashtag[];
}

export default function PopularHashtags({ hashtags }: PopularHashtagsProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <span className={styles.hash}>#</span> Popular Hashtags
      </h3>
      <ul className={styles.list}>
        {hashtags.map((item) => (
          <li key={item.rank} className={styles.item}>
            <span className={styles.rank}>{item.rank}</span>
            <div className={styles.info}>
              <span className={styles.tag}>{item.tag}</span>
              <span className={styles.count}>{item.posts.toLocaleString()} post</span>
            </div>
            {item.hot && <span className={styles.fire}>🔥</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
