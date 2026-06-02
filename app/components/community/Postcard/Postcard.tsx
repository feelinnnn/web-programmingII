'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import styles from './Postcard.module.css';
import { useUserId } from '@/lib/useauth';

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
  onLike?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onFollow?: (id: string) => void;
  onEdit?: (id: string, newContent: string, newImages: string[], newHashtags?: string[]) => Promise<boolean> | void;
  onDelete?: (id: string) => void;
  hashtags?: string[];
}

export default function PostCard({
  id, author, sub_namebio = "", time, content,
  imageUrls = [], imageUrl = [], image_url = [],
  avatarUrl, likes, comments: initialCommentsCount, isLiked = false, isBookmarked = false, isFollowing = false,
  onLike, onBookmark, onFollow, onEdit, onDelete, hashtags = [],
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ postId: id, content: newCommentText }),
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

  const handleSaveEdit = async () => {
    if (!onEdit || editContent.trim() === "") return;
    setIsSaving(true);
    try {
      await onEdit(id, editContent.trim(), editImages, editTags);
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

  const finalAvatarUrl = avatarUrl && avatarUrl !== "/avatar/default.png" ? avatarUrl : "/avatar/Avatar.png";

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            <img src={finalAvatarUrl} alt={author} className={styles.avatarImg} onError={(e) => { e.currentTarget.src = "/avatar/Avatar.png"; }} />
          </div>
          <div className={styles.userDetails}>
            <span className={styles.authorName}>{author}</span>
            <span className={styles.postMeta}>{sub_namebio ? `${sub_namebio} - ` : ''}{formatTimeAgo(time)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          {!onDelete && (
            <button className={`${styles.followBtn} ${isFollowing ? styles.followingBtn : ''}`} onClick={() => onFollow?.(id)}>
              {isFollowing ? 'Following' : '+ Follow'}
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
              onChange={(e) => setEditContent(e.target.value)}
              disabled={isSaving}
              rows={3}
              placeholder="Share your recipe here..."
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
      {!isEditing && finalImages && finalImages.length > 0 && finalImages[currentImgIndex] ? (
        <div className={styles.imageContainer} onClick={handleOpenPreview}>
          <img src={finalImages[currentImgIndex]} alt="post content" className={styles.image} />
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
          <button className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`} onClick={() => onLike?.(id)}>
            <span>{isLiked ? '❤️' : '♡'}</span> {likes}
          </button>
          <span className={styles.divider}>|</span>

          <button className={`${styles.actionBtn} ${showCommentsSection ? styles.activeCommentBtn : ''}`} onClick={handleToggleComments}>
            <span>💬</span> {commentCount}
          </button>

          <span className={styles.divider}>|</span>
          <button className={`${styles.actionBtn} ${isBookmarked ? styles.bookmarked : ''}`} onClick={() => onBookmark?.(id)}>
            <img src="/picture-navbar/bookmark.png" alt="bookmark" className={styles.bookmarkIcon} /> Bookmark
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
                    <p className={styles.commentBodyText}>{cmt.content}</p>
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
            <img src={finalImages[previewImgIndex]} alt="Fullscreen Preview" className={styles.lightboxImage} />
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