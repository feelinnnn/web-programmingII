'use client';

import { useState, useEffect } from 'react';
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
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("/avatar/Avatar.png");
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const fetchFeed = async (search?: string) => {
    try {
      setLoading(true);
      let url = currentUserId ? `/api/posts?currentUserId=${currentUserId}` : '/api/posts';
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPosts(json.data || []);
      }
    } catch (error) {
      console.error("Failed to load community feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreators = async () => {
    try {
      const res = await fetch('/api/popular-creations');
      if (res.ok) {
        const json = await res.json();
        if (json.success) setCreators(json.creators);
      }
    } catch (err) { console.error("Failed to load creators:", err); }
  };

  const fetchUserProfile = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.attributes?.profile_image_url) {
          setCurrentUserAvatar(json.data.attributes.profile_image_url);
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

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      alert("กรุณาล็อกอินก่อนกดไลค์นะคั้บ!");
      return;
    }

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
                  authorUserId={post.attributes.userId}
                  onLike={handleLike}
                  onEdit={isOwner ? (id, content, images, hashtags) => handleEdit(id, content, images, hashtags) : undefined}
                  onDelete={isOwner ? handleDelete : undefined}
                />
              );
            }}
          />
        )}
      </div>

      <aside className={styles.sidebar}>
        <PopularHashtags
          hashtags={hashtags.length > 0 ? hashtags : MOCK_HASHTAGS}
          onTagClick={(tag) => {
            if (searchQuery === tag) {
              setSearchQuery('');
              fetchFeed();
            } else {
              setSearchQuery(tag);
              fetchFeed(tag);
            }
          }}
        />
        <PopularCreations creators={creators.length > 0 ? creators : MOCK_CREATORS} currentUserId={currentUserId || undefined} />
      </aside>
    </div>
  );
}