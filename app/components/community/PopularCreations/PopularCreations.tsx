import styles from './PopularCreations.module.css';

export interface Creator {
  id: string;
  name: string;
  role: string;
  followers: string;
  avatarUrl?: string;
  isFollowing?: boolean;
  images: { url?: string; likes: number }[];
}

interface Props {
  creators: Creator[];
}

export default function PopularCreations({ creators }: Props) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🏆 Popular Creations</h3>
      <div className={styles.list}>
        {creators.map((creator) => (
          <div key={creator.id} className={styles.creatorBlock}>
            <div className={styles.creatorHeader}>
              <div className={styles.avatarWrap}>
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt={creator.name} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#a08060">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className={styles.creatorInfo}>
                <span className={styles.creatorName}>{creator.name}</span>
                <span className={styles.creatorMeta}>{creator.role} • {creator.followers} followers</span>
              </div>
              <button className={`${styles.followBtn} ${creator.isFollowing ? styles.following : ''}`}>
                {creator.isFollowing ? 'Following' : '+ Follow'}
              </button>
            </div>

            <div className={styles.imageGrid}>
              {creator.images.slice(0, 2).map((img, i) => (
                <div key={i} className={styles.imageCard}>
                  {img.url ? (
                    <img src={img.url} alt="creation" className={styles.image} />
                  ) : (
                    <div className={styles.imagePlaceholder} />
                  )}
                  <div className={styles.likeBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#e74c3c">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {img.likes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
