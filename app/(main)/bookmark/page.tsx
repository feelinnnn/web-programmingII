'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUserId } from '@/lib/useauth';
import Swal from 'sweetalert2';
import PostCard from '../../components/community/Postcard/Postcard';
import './bookmark.css';

export interface Bookmark {
  bookmark_id: string;
  user_id: string;
  target_id: string;
  post_id: string;
  target_type: 'post' | 'lesson';
  created_at: string;
}

export interface BookmarkDocument {
  _id: string;
  bookmark: Bookmark;
  __v: number;
}

interface PostApiStructure {
  id: string;
  type: string;
  attributes: {
    postId: string;
    userId: string;
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

export default function BookmarkPage() {
  const [posts, setPosts] = useState<PostApiStructure[]>([]);
  const [bookmarked, setBookmarked] = useState<BookmarkDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const currentUserId = useUserId() || "";
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);

  const fetchBookmarks = useCallback(async (append = false) => {
    if (!currentUserId) return;
    try {
      if (!append) {
        setLoading(true);
        pageRef.current = 0;
      } else {
        setLoadingMore(true);
      }
      const skip = append ? pageRef.current * 10 : 0;
      const res = await fetch(`/api/bookmark/posts?userId=${currentUserId}&skip=${skip}&limit=10`);
      const json = await res.json();
      if (res.ok && json.data) {
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
      console.error("Error fetching bookmarks:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [currentUserId]);

  // Fetch bookmark metadata (for PostCard bookmark state)
  const fetchBookmarkMeta = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/bookmark?userId=${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarked(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching bookmark meta:", error);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    fetchBookmarkMeta();
  }, [fetchBookmarks]);

  // Listen for bookmark changes from PostCard
  useEffect(() => {
    const handler = (e: Event) => {
      const { postId } = (e as CustomEvent).detail;
      if (postId) {
        setBookmarked(prev => prev.filter(item => item.bookmark.post_id !== postId));
        // Remove unbookmarked post from feed
        setPosts(prev => prev.filter(p => p.id !== postId));
      }
    };
    window.addEventListener("bookmark-changed", handler);
    return () => window.removeEventListener("bookmark-changed", handler);
  }, []);

  // Infinite scroll observer
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    fetchBookmarks(true);
  }, [loadingMore, hasMore, fetchBookmarks]);

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

  // Edit handler (own posts only)
  const handleEdit = async (postId: string, newContent: string, newImages: string[], newHashtags: string[]) => {
    setPosts(prev =>
      prev.map(p => p.id === postId ? {
        ...p,
        attributes: { ...p.attributes, content: newContent, imageUrls: newImages, hashtags: newHashtags }
      } : p)
    );
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, content: newContent, userId: currentUserId, imageUrls: newImages, hashtags: newHashtags })
      });
      if (!res.ok) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to edit post.' });
        fetchBookmarks();
      }
    } catch (error) {
      console.error("Error editing post:", error);
      fetchBookmarks();
    }
  };

  // Delete handler (own posts only)
  const handleDelete = async (postId: string) => {
    if (!currentUserId) return;
    const result = await Swal.fire({ icon: 'warning', title: 'Delete post?', text: 'This action cannot be undone.', showCancelButton: true, confirmButtonText: 'Delete', confirmButtonColor: '#e74c3c' });
    if (!result.isConfirmed) return;

    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      const res = await fetch(`/api/posts?id=${postId}&currentUserId=${currentUserId}`, { method: "DELETE" });
      if (!res.ok) {
        const errJson = await res.json();
        Swal.fire({ icon: 'error', title: 'Error', text: errJson.errors?.[0]?.detail || 'Failed to delete post.' });
        fetchBookmarks();
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      fetchBookmarks();
    }
  };

  // Like handler
  const handleLike = async (postId: string) => {
    if (!currentUserId) return;
    setLikingPosts(prev => { const next = new Set(prev); next.add(postId); return next; });

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, user_id: currentUserId }),
      });
      if (res.ok) {
        const result = await res.json();
        setPosts(prev =>
          prev.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                attributes: {
                  ...p.attributes,
                  likesCount: result.likesCount ?? result.likes_count ?? p.attributes.likesCount,
                  isLiked: result.isLiked ?? result.is_liked ?? !p.attributes.isLiked
                }
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLikingPosts(prev => { const next = new Set(prev); next.delete(postId); return next; });
      window.dispatchEvent(new Event("like-changed"));
    }
  };

  if (loading) {
    return (
      <div className="bk-layout">
        <main className="bk-main">
          <div className="bk-page">
            <h1 className="bk-title">Bookmark</h1>
            <div className="bk-loading">Loading bookmarks...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bk-layout">
      <main className="bk-main">
        <div className="bk-page">
          <h1 className="bk-title">Bookmark</h1>

          {!loading && posts.length === 0 ? (
            <p className="bk-empty">No bookmarks yet — save posts from the community feed!</p>
          ) : (
            <div className="bk-feed">
              {posts.map((post) => {
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
                    bookmarks={bookmarked}
                    authorUserId={post.attributes.userId}
                    likingActive={likingPosts.has(post.id)}
                    onLike={handleLike}
                    onEdit={isOwner ? handleEdit : undefined}
                    onDelete={isOwner ? handleDelete : undefined}
                  />
                );
              })}

              {/* Infinite scroll trigger + loading spinner */}
              <div ref={loadMoreRef} className="bk-loadMore">
                {loadingMore && <div className="bk-spinner" />}
                {!hasMore && posts.length > 0 && (
                  <p className="bk-noMore">— You're all caught up —</p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
