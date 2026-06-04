import { useState, useEffect, useCallback } from "react";
import styles from './PopularCreations.module.css';
import Swal from 'sweetalert2';

export interface Creator {
  id: string;
  name: string;
  sub_namebio: string;
  followers: string;
  avatarUrl?: string;
  isFollowing?: boolean;
  userId?: string;
  images: { url?: string; likes: number; postId?: string }[];
}

interface Props {
  creators: Creator[];
  currentUserId?: string;
  onCreatorClick?: (creator: Creator) => void;
  onImageClick?: (creator: Creator, postId?: string) => void;
}

export default function PopularCreations({ creators, currentUserId, onCreatorClick, onImageClick }: Props) {
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
  const [postImgErrors, setPostImgErrors] = useState<Record<string, boolean>>({});

  const setAvatarError = useCallback((key: string) => {
    setAvatarErrors(prev => ({ ...prev, [key]: true }));
  }, []);
  const setPostImgError = useCallback((key: string) => {
    setPostImgErrors(prev => ({ ...prev, [key]: true }));
  }, []);

  // Sync with community PostCard follow events
  useEffect(() => {
    const handler = (e: Event) => {
      const { authorUserId, isFollowing } = (e as CustomEvent).detail;
      if (authorUserId) {
        setFollowingMap(prev => ({ ...prev, [authorUserId]: isFollowing }));
      }
    };
    window.addEventListener("follow-changed", handler);
    return () => window.removeEventListener("follow-changed", handler);
  }, []);

  const handleFollow = async (creator: Creator) => {
    if (!currentUserId || !creator.userId) {
      Swal.fire({ icon: 'warning', title: 'Login required', text: 'Please login first!' });
      return;
    }
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerUserId: currentUserId, followingUserId: creator.userId })
      });
      if (res.ok) {
        const json = await res.json();
        const followKey = creator.userId || creator.id;
        const newState = json.data?.isFollowing ?? !followingMap[followKey];
        setFollowingMap(prev => ({ ...prev, [followKey]: newState }));
        // Sync with PostCards + user-profile
        window.dispatchEvent(new CustomEvent("follow-changed", {
          detail: { authorUserId: followKey, isFollowing: newState }
        }));
      }
    } catch (err) { console.error("Follow error:", err); }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>🏆 Popular Creations</h3>
      <div className={styles.list}>
        {creators.map((creator) => {
          const followKey = creator.userId || creator.id;
          const isFollowing = followingMap[followKey] ?? creator.isFollowing ?? false;
          const isSelf = currentUserId && creator.userId === currentUserId;
          return (
            <div key={creator.id} className={styles.creatorBlock}>
              <div className={styles.creatorHeader}>
                <div className={styles.avatarWrap}>
                  {creator.avatarUrl && !avatarErrors[creator.userId || creator.id] ? (
                    <img src={creator.avatarUrl} alt={creator.name} className={styles.avatar}
                      onError={() => setAvatarError(creator.userId || creator.id)} />
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
                  <span className={styles.creatorMeta}>{creator.sub_namebio} • {(creator as any).totalTopLikes || creator.followers} likes</span>
                </div>
                {!isSelf && (
                  <button
                    className={`${styles.followBtn} ${isFollowing ? styles.following : ''}`}
                    onClick={() => handleFollow(creator)}
                  >
                    {isFollowing ? 'Following' : '+ Follow'}
                  </button>
                )}
              </div>

              <div className={styles.imageGrid}>
                {creator.images.slice(0, 2).map((img, i) => {
                  const imgKey = `${creator.userId || creator.id}_${img.postId || i}`;
                  const imgFailed = postImgErrors[imgKey];
                  return (
                  <div key={i} className={styles.imageCard} onClick={() => onImageClick?.(creator, img.postId)} style={{ cursor: 'pointer' }}>
                    {img.url && !imgFailed ? (
                      <img
                        src={img.url}
                        alt="creation"
                        className={styles.image}
                        onError={() => setPostImgError(imgKey)}
                      />
                    ) : null}
                    <div className={`${styles.imagePlaceholder} ${!img.url || imgFailed ? styles.show : ''}`}>
                      <span className={styles.placeholderText}>See post</span>
                    </div>
                    <div className={styles.likeBadge}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#e74c3c">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      {img.likes}
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
