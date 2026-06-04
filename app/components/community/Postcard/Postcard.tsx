'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import styles from './Postcard.module.css';
import { useUserId } from '@/lib/useauth';
import { json } from 'stream/consumers';

function formatTimeAgo(dateString: string | Date): string {
  if (!dateString) return "เมื่อสักครู่";
  const postDate = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return postDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

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

interface FlattenedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  videoUrl: string;
  createdAt: string | Date;
  author: string;
  avatarUrl: string;
}

export interface PostCardProps {
  id: string;
  author: string;
  sub_namebio?: string;
  time: string;
  content: string;
  imageUrls?: string[];
  imageUrl?: string[];
  image_url?: string[];
  avatarUrl?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isFollowing?: boolean;
  bookmarks?: BookmarkDocument[];
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onFollow?: (id: string) => void;
  onEdit?: (id: string, newContent: string, newImages: string[], newHashtags: string[]) => Promise<void> | void;
  onDelete?: (id: string) => void;
  onComment?: (id: string) =>void;
  hashtags?: string[];
  authorUserId?: string;
  likingActive?: boolean;
}


export default function PostCard({
  id, author, sub_namebio = "", time, content,
  imageUrls = [], imageUrl = [], image_url = [],
  avatarUrl, likes, comments: initialCommentsCount, isLiked = false, bookmarks , isFollowing = false,
  onLike, onBookmark, onFollow, onEdit, onDelete, onComment, hashtags = [],
  authorUserId = "",
  likingActive = false,
}: PostCardProps) {

  const userId = useUserId();
  const [menuOpen, setMenuOpen] = useState(false);
  const finalImages = useMemo(() => {
    return imageUrls.length > 0 ? imageUrls : (imageUrl.length > 0 ? imageUrl : image_url);
  }, [imageUrls, imageUrl, image_url]);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [previewImgIndex, setPreviewImgIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [myBookmarks, setMyBookmarks] = useState<BookmarkDocument[]>(bookmarks!) 
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [editImages, setEditImages] = useState<string[]>(finalImages);
  const [editTags, setEditTags] = useState<string[]>(hashtags);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [showCommentsSection, setShowCommentsSection] = useState(false);
  const [commentsList, setCommentsList] = useState<FlattenedComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentsCount);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [contentImgErrors, setContentImgErrors] = useState<Record<number, boolean>>({});
  const [followState, setFollowState] = useState(isFollowing);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Check follow status on mount
  useEffect(() => {
    if (!userId || !authorUserId || onDelete) return;
    fetch(`/api/follow?followerUserId=${userId}&followingUserId=${authorUserId}`)
      .then(res => res.json())
      .then(data => setFollowState(data.data?.isFollowing ?? false))
      .catch(() => {});
  }, [userId, authorUserId, onDelete]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (bookmarks) {
      setMyBookmarks(bookmarks);
    }
  }, [bookmarks]);

  // Listen for bookmark changes from bookmark page
  useEffect(() => {
    const handler = (e: Event) => {
      const { postId } = (e as CustomEvent).detail;
      if (postId === id && userId) {
        fetch(`/api/bookmark?userId=${userId}`)
          .then(res => res.json())
          .then(data => { if (data.data) setMyBookmarks(data.data); })
          .catch(() => {});
      }
    };
    window.addEventListener("bookmark-changed", handler);
    return () => window.removeEventListener("bookmark-changed", handler);
  }, [id, userId]);
  useEffect(() =>{
    const fetchInitComment =  async ()=>{
        try {
        const res = await fetch(`/api/comments?postId=${id}`);
        const data = await res.json();
        if (data.success) {
          setCommentCount(data.comments.length);
        } else {
          setCommentError(data.error || "can not load comments");
        }
      } catch (err) {
        setCommentError("can not connect to comment system");
      } finally {
        setIsLoadingComments(false);
      }
    }
    fetchInitComment();
  }, [])

  const handleToggleComments = () => {
    setShowCommentsSection(!showCommentsSection);
    if (!showCommentsSection) fetchComments();
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/comments?postId=${id}`);
      const data = await res.json();
      if (data.success) {
        setCommentsList(data.comments);
      } else {
        setCommentError(data.error || "can not load comments");
      }
    } catch (err) {
      setCommentError("can not connect to comment system");
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;

    if (!userId) {
      alert("please login first!");
      return;
    }

    setIsSubmittingComment(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId: id, userId : userId,content: newCommentText }),
      });

      const data = await res.json();

      if (res.status === 401) {
        alert("Session expired. Please login again.");
        return;
      }

      if (data.success) {
        setCommentsList((prev) => [...prev, data.comment]);
        setCommentCount((prev) => prev + 1);
        setNewCommentText('');
      } else {
        alert(data.error || "An error occurred while submitting the comment.");
      }
    } catch (err) {
      console.error("Submit Comment Error:", err);
      alert("Cannot connect to the server.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStartEditing = () => {
    setEditContent(content);
    setEditImages(finalImages);
    setEditTags(hashtags);
    setTagInput('');
    setIsEditing(true);
    setMenuOpen(false);
  };

  const MAX_CHARS = 500;

  // Auto-detect #hashtags from edit text
  const handleEditTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_CHARS);
    setEditContent(value);
    const detected = [...value.matchAll(/#([\w฀-๿]+)/g)].map(m => m[1]);
    setEditTags(prev => {
      const existing = new Set(prev);
      detected.forEach(t => existing.add(t));
      return [...existing];
    });
  };

  const handleSaveEdit = async () => {
    if (!onEdit || editContent.trim() === "") return;
    setIsSaving(true);
    try {
      // Upload new images (blob URLs) to Cloudinary first
      const blobUrls = editImages.filter(u => u.startsWith("blob:"));
      let finalImages = editImages.filter(u => !u.startsWith("blob:"));
      for (const blobUrl of blobUrls) {
        try {
          const response = await fetch(blobUrl);
          const blob = await response.blob();
          const formData = new FormData();
          formData.append("file", blob, "edit-upload.jpg");
          const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
          const uploadData = await uploadRes.json();
          if (uploadData.url) finalImages.push(uploadData.url);
        } catch {}
      }
      await onEdit(id, editContent.trim(), finalImages, editTags);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImageUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newImageUrls.push(url);
    }
    setEditImages([...editImages, ...newImageUrls]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setEditImages(editImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!editTags.includes(newTag)) setEditTags([...editTags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((t) => t !== tagToRemove));
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (finalImages.length <= 1) return;
    setCurrentImgIndex((prev) => (prev - 1 + finalImages.length) % finalImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (finalImages.length <= 1) return;
    setCurrentImgIndex((prev) => (prev + 1) % finalImages.length);
  };

  const handleLightboxPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (finalImages.length <= 1) return;
    setPreviewImgIndex((prev) => (prev - 1 + finalImages.length) % finalImages.length);
  };

  const handleLightboxNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (finalImages.length <= 1) return;
    setPreviewImgIndex((prev) => (prev + 1) % finalImages.length);
  };

  const handleOpenPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewImgIndex(currentImgIndex);
    setIsPreviewOpen(true);
  };

  const handleFollow = async () => {
    if (!userId) { alert("Please login first!"); return; }
    if (!authorUserId) return;
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerUserId: userId, followingUserId: authorUserId })
      });
      if (res.ok) {
        const json = await res.json();
        const newState = json.data?.isFollowing ?? !followState;
        setFollowState(newState);
        // Sync all other PostCards + user-profile via custom event
        window.dispatchEvent(new CustomEvent("follow-changed", {
          detail: { authorUserId, isFollowing: newState }
        }));
      }
    } catch (err) { console.error("Follow error:", err); }
  };

  // Listen for follow-changed events from other PostCards
  useEffect(() => {
    const handler = (e: Event) => {
      const { authorUserId: changedUserId, isFollowing: newState } = (e as CustomEvent).detail;
      if (changedUserId === authorUserId) {
        setFollowState(newState);
      }
    };
    window.addEventListener("follow-changed", handler);
    return () => window.removeEventListener("follow-changed", handler);
  }, [authorUserId]);

  const handleEditComment = async (commentId: string) => {
    if (!editCommentText.trim() || !userId) return;
    try {
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId, content: editCommentText.trim() })
      });
      if (res.ok) {
        setCommentsList(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentText.trim() } : c));
        setEditingCommentId(null);
        setEditCommentText('');
      }
    } catch (err) { console.error("Edit comment error:", err); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) return;
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`/api/comments?commentId=${commentId}&userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setCommentsList(prev => prev.filter(c => c.id !== commentId));
        setCommentCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) { console.error("Delete comment error:", err); }
  };

const handleBookmark = async (id : string) =>{

    const foundTarget = myBookmarks?.find(item => item.bookmark.post_id === id);

    if(!foundTarget){

      console.log(id)
      const res = await fetch(`/api/bookmark`,{
        method : "POST",
        headers : {'Content-Type': 'application/json', },
        body : JSON.stringify({postId : id, userId : userId, targetType :  "post"})
      })
      if(!res.ok){
        alert("Cannot add bookmark something wrong in handleBookmark Function (POST Bookmark)" );
        return;
      }
      const data = await res.json();

      if (data.insertBookmark) {
        setMyBookmarks((prev) => [...prev, data.insertBookmark]);
        window.dispatchEvent(new CustomEvent("bookmark-changed", { detail: { postId: id } }));
      }
    } else {
      
      const bookmarkIdToDelete = foundTarget.bookmark.bookmark_id;

      const res = await fetch(`/api/bookmark?bookmarkId=${bookmarkIdToDelete}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        alert("Cannot remove bookmark something wrong in handleBookmark Function (DELETE Bookmark)");
        return;
      }

      setMyBookmarks((prev) => prev.filter(item => item.bookmark.bookmark_id !== bookmarkIdToDelete));
      window.dispatchEvent(new CustomEvent("bookmark-changed", { detail: { postId: id } }));
    }
}

  const finalAvatarUrl = avatarUrl && !avatarError ? avatarUrl : "/avatar/Avatar.png";

  const handleProfileClick = () => {
    if (authorUserId) {
      window.open(`/user-profile?user_id=${authorUserId}`, '_blank');
    }
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar} onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <img src={finalAvatarUrl} alt={author} className={styles.avatarImg} onError={() => setAvatarError(true)} />
          </div>
          <div className={styles.userDetails}>
            <span className={styles.authorName} onClick={handleProfileClick} style={{ cursor: 'pointer' }}>{author}</span>
            <span className={styles.postMeta}>{sub_namebio ? `${sub_namebio} - ` : ''}{formatTimeAgo(time)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!onDelete && (
            <button className={`${styles.followBtn} ${followState ? styles.followingBtn : ''}`} onClick={handleFollow}>
              {followState ? 'Following' : '+ Follow'}
            </button>
          )}
          {(onEdit || onDelete) && !isEditing && (
            <div className={styles.menuWrap} ref={menuRef}>
              <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)}>⋮</button>
              {menuOpen && (
                <div className={styles.dropdown}>
                  {onEdit && <button className={styles.dropdownItem} onClick={handleStartEditing}>Edit Post</button>}
                  {onDelete && <button className={`${styles.dropdownItem} ${styles.deleteItem}`} onClick={() => { onDelete(id); setMenuOpen(false); }}>Delete</button>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body Section */}
      <div className={styles.body}>
        {isEditing ? (
          <div className={styles.expanded}>
            <textarea
              autoFocus
              className={styles.textarea}
              value={editContent}
              onChange={handleEditTextChange}
              disabled={isSaving}
              rows={3}
              placeholder="Share your recipe here..."
              maxLength={MAX_CHARS}
            />

            {/* Grid รูปภาพพรีวิวแก้โพสต์ */}
            {editImages.length > 0 && (
              <div className={styles.imageGrid}>
                {editImages.map((src, i) => (
                  <div key={i} className={styles.imageThumb}>
                    <img src={src} alt={`edit-preview-${i}`} />
                    <button type="button" className={styles.removeImg} onClick={() => handleRemoveImage(i)} disabled={isSaving}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* กล่องแท็กแก้ไข */}
            <div className={styles.tagArea}>
              {editTags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  #{tag}
                  <button type="button" className={styles.tagRemove} onClick={() => removeTag(tag)} disabled={isSaving}>✕</button>
                </span>
              ))}
              <input
                className={styles.tagInput}
                placeholder="Add tag... (Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={isSaving}
              />
            </div>

            {/* แถบควบคุมล่างสุดในโหมด Edit */}
            <div className={styles.bottomBar}>
              <div className={styles.toolBtns}>
                <button type="button" className={styles.toolBtn} onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                />

                <button type="button" className={styles.toolBtn} onClick={() => document.querySelector<HTMLInputElement>(`.${styles.tagInput}`)?.focus()} disabled={isSaving}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  Tag
                </button>
              </div>

              <div className={styles.actionsBlock}>
                <button type="button" className={styles.cancelBtn} onClick={() => { setIsEditing(false); setEditContent(content); setEditImages(finalImages); setEditTags(hashtags); }} disabled={isSaving}>Cancel</button>
                <button type="button" className={styles.postBtn} disabled={!editContent.trim() || isSaving} onClick={handleSaveEdit}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className={styles.text}>{content}</p>
            {hashtags.length > 0 && (
              <div className={styles.feedTagsDisplay}>
                {hashtags.map(tag => (
                  <span key={tag} className={styles.feedTagItem}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* โซนแสดงรูปภาพบนหน้าฟีดปกติ */}
      {!isEditing && finalImages && finalImages.length > 0 && finalImages[currentImgIndex] && !contentImgErrors[currentImgIndex] ? (
        <div className={styles.imageContainer} onClick={handleOpenPreview}>
          <img src={finalImages[currentImgIndex]} alt="post content" className={styles.image}
            onError={() => setContentImgErrors(prev => ({ ...prev, [currentImgIndex]: true }))} />
          {finalImages.length > 1 && <div className={styles.imageBadge}>{currentImgIndex + 1}/{finalImages.length}</div>}
          {finalImages.length > 1 && (
            <>
              <button className={styles.slideBtnLeft} onClick={handlePrevImage}>‹</button>
              <button className={styles.slideBtnRight} onClick={handleNextImage}>›</button>
            </>
          )}
        </div>
      ) : null}

      {/* Actions Bar ปุ่มกดไลก์ คอมเมนต์ บุ๊กมาร์ก */}
      {!isEditing && (
        <div className={styles.actions}>
          <button className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`} onClick={() => onLike?.(id)} disabled={likingActive}>
            <span>{isLiked ? '❤️' : '♡'}</span> {likes}
          </button>
          <span className={styles.divider}>|</span>

          <button className={`${styles.actionBtn} ${showCommentsSection ? styles.activeCommentBtn : ''}`} onClick={handleToggleComments}>
            <span>💬</span> {commentCount}
          </button>

          <span className={styles.divider}>|</span>
          <button className={`${styles.actionBtn} ${myBookmarks?.some(item => item.bookmark.post_id === id) ? styles.bookmarked : ''}`} onClick={() => handleBookmark(id)}>
            <svg width="16" height="16" viewBox="0 0 24 24" className={styles.bookmarkSvg}>
              <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z"
                fill={myBookmarks?.some(item => item.bookmark.post_id === id) ? "#D88A3C" : "none"}
                stroke={myBookmarks?.some(item => item.bookmark.post_id === id) ? "#D88A3C" : "#999"}
                strokeWidth="2"
              />
            </svg>
            Bookmark
          </button>
        </div>
      )}

      {/* ── 💬 ส่วนแสดงผลคอมเมนต์ย่อยใต้โพสต์ (Comments Dropdown Section) ── */}
      {!isEditing && showCommentsSection && (
        <div className={styles.commentsContainer}>
          <h4 className={styles.commentsTitle}>Comments ({commentCount})</h4>

          {/* 1. ฟอร์มสำหรับพิมพ์ส่งความคิดเห็นใหม่ */}
          <form onSubmit={handlePostComment} className={styles.commentForm}>
            <div className={styles.commentInputWrap}>
              <input
                type="text"
                placeholder={userId ? "Write a comment..." : "Please log in to comment"}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                disabled={!userId || isSubmittingComment}
                className={styles.commentInputField}
              />
              <button
                type="submit"
                disabled={!newCommentText.trim() || isSubmittingComment || !userId}
                className={styles.commentSendBtn}
              >
                {isSubmittingComment ? "..." : "Send"}
              </button>
            </div>
          </form>

          {/* 2. รายการข้อความคอมเมนต์ */}
          {isLoadingComments ? (
            <div className={styles.commentsLoader}></div>
          ) : commentError ? (
            <div className={styles.commentsError}>{commentError}</div>
          ) : commentsList.length === 0 ? (
            <div className={styles.noComments}>not have comments</div>
          ) : (
            <div className={styles.commentsListStack}>
              {commentsList.map((cmt) => (
                <div key={cmt.id} className={styles.commentCardRow}>
                  <img
                    src={cmt.avatarUrl || "/avatar/Avatar.png"}
                    alt={cmt.author}
                    className={styles.commenterAvatar}
                    onError={(e) => { e.currentTarget.src = "/avatar/Avatar.png"; }}
                  />
                  <div className={styles.commentBubbleWrap}>
                    <div className={styles.commentHeaderInfo}>
                      <span className={styles.commenterName}>{cmt.author}</span>
                      <span className={styles.commentTimeMeta}>{formatTimeAgo(cmt.createdAt)}</span>
                    </div>
                    {editingCommentId === cmt.id ? (
                      <div className={styles.commentEditRow}>
                        <input
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          className={styles.commentEditInput}
                          onKeyDown={(e) => e.key === 'Enter' && handleEditComment(cmt.id)}
                        />
                        <button onClick={() => handleEditComment(cmt.id)} className={styles.commentSaveBtn}>✓</button>
                        <button onClick={() => { setEditingCommentId(null); setEditCommentText(''); }} className={styles.commentCancelBtn}>✕</button>
                      </div>
                    ) : (
                      <p className={styles.commentBodyText}>{cmt.content}</p>
                    )}
                    {userId === cmt.userId && editingCommentId !== cmt.id && (
                      <div className={styles.commentActions}>
                        <button onClick={() => { setEditingCommentId(cmt.id); setEditCommentText(cmt.content); }} className={styles.commentActionBtn}>Edit</button>
                        <button onClick={() => handleDeleteComment(cmt.id)} className={styles.commentActionBtn + ' ' + styles.commentDeleteBtn}>Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Popup Lightbox ขยายรูป */}
      {isPreviewOpen && finalImages.length > 0 && (
        <div className={styles.lightboxOverlay} onClick={() => setIsPreviewOpen(false)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeLightboxBtn} onClick={() => setIsPreviewOpen(false)}>×</button>
            {!contentImgErrors[previewImgIndex] ? (
              <img src={finalImages[previewImgIndex]} alt="Fullscreen Preview" className={styles.lightboxImage}
                onError={() => setContentImgErrors(prev => ({ ...prev, [previewImgIndex]: true }))} />
            ) : null}
            {finalImages.length > 1 && (
              <>
                <button className={styles.lightboxArrowLeft} onClick={handleLightboxPrev}>‹</button>
                <button className={styles.lightboxArrowRight} onClick={handleLightboxNext}>›</button>
                <div className={styles.lightboxIndicator}>รูปภาพที่ {previewImgIndex + 1} จากทั้งหมด {finalImages.length} ใบ</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}