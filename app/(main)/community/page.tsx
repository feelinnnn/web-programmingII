'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserId } from "@/lib/useauth"; 

import SearchBar from '../../components/community/SearchBar/SearchBar';
import CreatePost from '../../components/community/CreatePost/CreatePost';
import TodayFeed from '../../components/community/TodayFeed/TodayFeed';
import PopularHashtags from '../../components/community/PopularHashtags/PopularHashtags';
import PopularCreations from '../../components/community/PopularCreations/PopularCreations';
import PostCard from '../../components/community/Postcard/Postcard';

import type { Hashtag } from '../../components/community/PopularHashtags/PopularHashtags';
import type { Creator } from '../../components/community/PopularCreations/PopularCreations';

import styles from './page.module.css';

export interface PostApiStructure {
  id: string;
  type: string;
  attributes: {
    postId: string;
    userId: string;
    creatorId?: string;
    content: string;
    hashtags: string[];
    imageUrls: string[];
    recipeUrl?: string;
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    isLiked: boolean;
    creator: {
      displayName: string;
      profileImageUrl: string;
      sub_namebio: string;
    };
  };
}

const MOCK_HASHTAGS: Hashtag[] = [
  { rank: 1, tag: '#ผัดไทย', posts: 1203, hot: true },
  { rank: 2, tag: '#เบเกอรี่', posts: 806 },
  { rank: 3, tag: '#คุกกี้', posts: 789 },
];

const MOCK_CREATORS: Creator[] = [
  { id: '1', name: 'Wanilla Pie', sub_namebio: 'Home Cook', followers: '2.1K', images: [{ likes: 507 }, { likes: 345 }] },
];

export interface Bookmark {
  bookmark_id: string;
  user_id: string;
  target_id: string;
  post_id :string;
  target_type: 'post' | 'lesson'; // เจาะจงประเภทตามค่าที่ยอมรับได้
  created_at: string;             // ฝั่งหน้าบ้านที่รับจาก API จะได้มาเป็น String (ISO Date)
}

export interface BookmarkDocument {
  _id: string;
  bookmark: Bookmark;
  __v: number;
}

// เวลาใช้งานจริง เนื่องจากข้อมูลส่งกลับมาเป็น Array []
// ตัวแปรที่ใช้รับค่าจะเป็นชนิด BookmarkDocument[] ครับ

export default function CommunityFeedPage() {
  const [posts, setPosts] = useState<PostApiStructure[]>([]);
  const [bookmarked, setBookmarked] = useState<BookmarkDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("/avatar/Avatar.png");
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());
  const hashtagFilterRef = useRef<string | null>(null);
  const creatorFilterRef = useRef<string | null>(null);
  const imageFilterRef = useRef<string | null>(null);
  const fetchCreatorsRef = useRef<() => void>(() => {});
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const activePostIdRef = useRef<string | null>(null);
  const activeCreatorIdRef = useRef<string | null>(null);
  const activeSearchRef = useRef<string | null>(null);

  const currentUserId = useUserId() || ""; 

    // 🔑 แก้ไขตรงส่วน fetchBookmark ในหน้าหลักของคุณ
  useEffect(() => {
    // ดักจับ: ถ้ายังไม่มีไอดีผู้ใช้ (ยังโหลดเซสชันไม่เสร็จ) ไม่ต้องเพิ่งยิง API ให้เสียเวลา
    if (!currentUserId) return;

    const fetchBookmark = async () => {
      try {
        const res = await fetch(`/api/bookmark?userId=${currentUserId}`, {
          method: "GET",
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
          const data = await res.json();
          setBookmarked(data.data || []); // เก็บรายการบุ๊กมาร์กจริงลง State
        }
      } catch (error) {
        console.error("Failed to load bookmarks:", error);
      }
    };

    fetchBookmark();
  }, [currentUserId]); // 👈 เพิ่ม currentUserId เข้าไปใน Dependency Array ตรงนี้!

  const fetchHashtags = async () => {
    try {
      const res = await fetch('/api/hashtags');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setHashtags(json.hashtags);
      }
    } catch (error) {
      console.error("Failed to load hashtags:", error);
    }
  };

  // Load more when scrolled to bottom
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchFeed(activeSearchRef.current || undefined, activeCreatorIdRef.current || undefined, activePostIdRef.current || undefined, true);
  }, [loadingMore, hasMore]);

  const fetchFeed = async (search?: string, creatorId?: string, postId?: string, append = false) => {
    try {
      if (!append) {
        setLoading(true);
        pageRef.current = 0;
      } else {
        setLoadingMore(true);
      }
      const skip = append ? pageRef.current * 10 : 0;
      const params = new URLSearchParams();
      if (currentUserId) params.set("currentUserId", currentUserId);
      params.set("skip", String(skip));
      params.set("limit", "10");
      if (postId) params.set("postId", postId);
      else if (creatorId) params.set("creatorId", creatorId);
      else if (search) params.set("search", search);
      const url = `/api/posts?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (append) {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = (json.data || []).filter((p: any) => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(json.data || []);
        }
        setHasMore(json.meta?.hasMore ?? false);
        if (!append) pageRef.current = 1;
        else pageRef.current++;
      }
    } catch (error) {
      console.error("Failed to load community feed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const params = new URLSearchParams();
      if (currentUserId) params.set("currentUserId", currentUserId);
      const res = await fetch(`/api/popular-creations?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setCreators(json.creators || []);
      }
    } catch (err) { console.error("Failed to load creators:", err); }
  };
  fetchCreatorsRef.current = fetchCreators;

  const fetchUserProfile = async () => {
    if (!currentUserId) return;
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch('/api/profile', { headers });
      if (res.ok) {
        const json = await res.json();
        const url = json?.data?.attributes?.profile_image_url;
        if (url) {
          setCurrentUserAvatar(url.replace(/=s\d+-c/, "=s400"));
        }
      }
    } catch (error) {
      console.error("Failed to load user profile avatar:", error);
    }
  };

  useEffect(() => {
    fetchFeed();
    fetchUserProfile();
    fetchHashtags();
    fetchCreators();
  }, [currentUserId]);

  // Refresh creators + hashtags when follow/like/post changes
  useEffect(() => {
    const refresh = () => { fetchCreatorsRef.current(); fetchHashtags(); };
    window.addEventListener("follow-changed", refresh);
    window.addEventListener("post-created", refresh);
    window.addEventListener("like-changed", refresh);
    return () => {
      window.removeEventListener("follow-changed", refresh);
      window.removeEventListener("post-created", refresh);
      window.removeEventListener("like-changed", refresh);
    };
  }, []);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      alert("กรุณาล็อกอินก่อนกดไลค์นะคั้บ!");
      return;
    }
    // Prevent double-click
    if (likingPosts.has(postId)) return;
    setLikingPosts(prev => new Set(prev).add(postId));

    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const currentlyLiked = p.attributes.isLiked;
          return {
            ...p,
            attributes: {
              ...p.attributes,
              isLiked: !currentlyLiked,
              likesCount: currentlyLiked ? Math.max(0, p.attributes.likesCount - 1) : p.attributes.likesCount + 1
            }
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, post_id: postId })
      });

      if (!res.ok) {
        fetchFeed();
      } else {
        const result = await res.json();
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                attributes: {
                  ...p.attributes,
                  likesCount: typeof result.likesCount !== 'undefined' ? result.likesCount : (result.likes_count ?? p.attributes.likesCount),
                  isLiked: typeof result.isLiked !== 'undefined' ? result.isLiked : (result.is_liked ?? p.attributes.isLiked)
                }
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      fetchFeed();
    } finally {
      setLikingPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      window.dispatchEvent(new Event("like-changed"));
    }
  };

  const handleDelete = async (postId: string) => {
    if (!currentUserId) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this post?");
    if (!confirmDelete) return;

    setPosts((prevPosts) => prevPosts.filter((p) => p.id !== postId));

    try {
      const res = await fetch(`/api/posts?id=${postId}&currentUserId=${currentUserId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json();
        alert(errJson.errors?.[0]?.detail || "Failed to delete post.");
        fetchFeed();
      } else {
        fetchHashtags();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      fetchFeed();
    }
  };

  const handleEdit = async (postId: string, newContent: string, newImages: string[], newHashtags: string[]) => {
    const postToEdit = posts.find((p) => p.id === postId);
    if (!postToEdit) return;

    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              attributes: {
                ...p.attributes,
                content: newContent,
                imageUrls: newImages,
                hashtags: newHashtags
              }
            }
          : p
      )
    );

    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          content: newContent,
          userId: currentUserId,
          imageUrls: newImages,
          hashtags: newHashtags
        })
      });

      if (!res.ok) {
        alert("แก้ไขโพสต์และรูปภาพไม่สำเร็จ");
        fetchFeed();
      } else {
        fetchHashtags();
      }
    } catch (error) {
      console.error("Error editing post content and images:", error);
      fetchFeed();
    }
  };


  return (
    <div className={styles.page}>
      <div className={styles.main}>
        <div className={styles.topBar}>
          <h1 className={styles.pageTitle}>Community Feed</h1>
          <SearchBar onSearch={(q) => { setSearchQuery(q); fetchFeed(q); }} />
        </div>

        {/* Mobile-only: sidebar above CreatePost */}
        <div className={styles.mobileSidebar}>
          <PopularHashtags
            hashtags={hashtags.length > 0 ? hashtags : MOCK_HASHTAGS}
            onTagClick={(tag) => {
              if (searchQuery === tag) {
                setSearchQuery('');
                activeSearchRef.current = null;
                hashtagFilterRef.current = null;
                fetchFeed();
              } else {
                setSearchQuery(tag);
                hashtagFilterRef.current = tag;
                activeSearchRef.current = tag;
                fetchFeed(tag);
              }
            }}
            selectedHashtag={searchQuery}
          />
          <PopularCreations
            creators={(creators?.length ?? 0) > 0 ? creators : MOCK_CREATORS}
            currentUserId={currentUserId}
            onPostCreated={() => fetchFeed()}
          />
        </div>

        <CreatePost
          currentUserId={currentUserId}
          userAvatar={currentUserAvatar}
          onPostCreated={() => { fetchFeed(); fetchHashtags(); fetchCreators(); }}
        />

        {loading ? (
          <div className={styles.loading}>กำลังโหลดข้อมูลคอมมูนิตี้...</div>
        ) : (
          <TodayFeed
            posts={posts}
            renderPost={(post) => {
              const isOwner = currentUserId && post.attributes.userId === currentUserId;
              return (
                <PostCard
                  key={post.id}
                  id={post.id}
                  author={post.attributes.creator.displayName}
                  sub_namebio={post.attributes.creator.sub_namebio}
                  time={post.attributes.createdAt}
                  content={post.attributes.content}
                  imageUrls={post.attributes.imageUrls}
                  imageUrl={post.attributes.imageUrls}
                  avatarUrl={post.attributes.creator.profileImageUrl}
                  likes={post.attributes.likesCount}
                  comments={post.attributes.commentsCount}
                  isLiked={post.attributes.isLiked}
                  hashtags={post.attributes.hashtags}
                  bookmarks ={bookmarked}
                  authorUserId={post.attributes.creatorId || post.attributes.userId}
                  likingActive={likingPosts.has(post.id)}
                  onLike={handleLike}
                  onEdit={isOwner ? (id, content, images, hashtags) => handleEdit(id, content, images, hashtags) : undefined}
                  onDelete={isOwner ? handleDelete : undefined}
                />
              );
            }}
          />
        )}

        {/* Infinite scroll trigger + loading spinner */}
        <div ref={loadMoreRef} className={styles.loadMore}>
          {loadingMore && <div className={styles.spinner} />}
          {!hasMore && posts.length > 0 && (
            <p className={styles.noMore}>— You're all caught up —</p>
          )}
        </div>
      </div>

      <aside className={styles.sidebar}>
        <PopularHashtags
          hashtags={hashtags.length > 0 ? hashtags : MOCK_HASHTAGS}
          onTagClick={(tag) => {
            if (hashtagFilterRef.current === tag) {
              hashtagFilterRef.current = null;
              activeSearchRef.current = null;
              setSearchQuery('');
              fetchFeed();
            } else {
              hashtagFilterRef.current = tag;
              creatorFilterRef.current = null;
              imageFilterRef.current = null;
              activeSearchRef.current = tag;
              activeCreatorIdRef.current = null;
              activePostIdRef.current = null;
              setSearchQuery(tag);
              fetchFeed(tag);
            }
          }}
        />
        <PopularCreations
          creators={(creators?.length ?? 0) > 0 ? creators : MOCK_CREATORS}
          currentUserId={currentUserId || undefined}
          onCreatorClick={(creator) => {
            if (creator.userId) {
              if (creatorFilterRef.current === creator.userId) {
                creatorFilterRef.current = null;
                activeCreatorIdRef.current = null;
                setSearchQuery('');
                fetchFeed();
              } else {
                creatorFilterRef.current = creator.userId;
                hashtagFilterRef.current = null;
                imageFilterRef.current = null;
                activeCreatorIdRef.current = creator.userId;
                activeSearchRef.current = null;
                activePostIdRef.current = null;
                setSearchQuery(creator.name);
                fetchFeed(undefined, creator.userId);
              }
            }
          }}
          onImageClick={(creator, postId) => {
            if (postId) {
              if (imageFilterRef.current === postId) {
                imageFilterRef.current = null;
                activePostIdRef.current = null;
                setSearchQuery('');
                fetchFeed();
              } else {
                imageFilterRef.current = postId;
                creatorFilterRef.current = null;
                hashtagFilterRef.current = null;
                activePostIdRef.current = postId;
                activeCreatorIdRef.current = null;
                activeSearchRef.current = null;
                setSearchQuery('');
                fetchFeed(undefined, undefined, postId);
              }
            }
          }}
        />
      </aside>
    </div>
  );
}