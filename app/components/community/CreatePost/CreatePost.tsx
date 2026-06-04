'use client';

import { useState, useRef } from 'react';
import styles from './CreatePost.module.css';

interface CreatePostProps {
  currentUserId: string;      
  userAvatar?: string;        
  onPostCreated?: () => void; 
}

export default function CreatePost({ currentUserId, userAvatar, onPostCreated }: CreatePostProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
   
  // rawFiles สำหรับส่งไฟล์ดิบไป API , previewsรูปพรีวิว
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false); // เช็คสถานะการโหลด
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_CHARS = 500;

  // Auto-detect #hashtags from text
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, MAX_CHARS);
    setText(value);
    const detected = [...value.matchAll(/#([\w฀-๿]+)/g)].map(m => m[1]);
    setTags(prev => {
      const existing = new Set(prev);
      detected.forEach(t => existing.add(t));
      return [...existing];
    });
  };

  const handleClose = () => {
    setOpen(false);
    setText('');
    setTags([]);
    setTagInput('');
    setRawFiles([]);
    setPreviews([]);
    setLoading(false);
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setLoading(true);

    let finalImageUrls: string[] = [];

    try {
      if (rawFiles.length > 0) {
        for (let i = 0; i < rawFiles.length; i++) {
          const formData = new FormData();
          formData.append('file', rawFiles[i]); 

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadRes.json();
          
          if (uploadData.url) {
            finalImageUrls.push(uploadData.url);
          } else {
            console.error('Error uploading image:', uploadData.error);
          }
        }
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            type: 'post',
            attributes: {
              userId: currentUserId,
              content: text,
              imageUrls: finalImageUrls, 
              hashtags: tags,          
              recipeUrl: ""
            }
          }
        })
      });

      if (res.ok) {
        handleClose();
        window.dispatchEvent(new Event("post-created"));
        onPostCreated?.();
      } else {
        const errData = await res.json();
        alert(errData.errors?.[0]?.detail || 'Failed to create post.');
      }

    } catch (error) {
      console.error('Error creating post:', error);
      alert('An error occurred while creating the post.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    setRawFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPreviews((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = ''; // เคลียร์ช่อง input
  };

  const removeImage = (index: number) => {
    setRawFiles(rawFiles.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatarWrap}>
        {userAvatar ? (
          <img src={userAvatar} alt="avatar" className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#a08060">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
        )}
      </div>

      {!open ? (
        <button className={styles.placeholder} onClick={() => setOpen(true)}>
          Share your recipe here...
        </button>
      ) : (
        <div className={styles.expanded}>
          <textarea
            autoFocus
            className={styles.textarea}
            placeholder="Share your recipe here..."
            value={text}
            onChange={handleTextChange}
            rows={3}
            disabled={loading}
            maxLength={MAX_CHARS}
          />
          <span className={styles.charCount}>{text.length}/{MAX_CHARS}</span>

          {previews.length > 0 && (
            <div className={styles.imageGrid}>
              {previews.map((src, i) => (
                <div key={i} className={styles.imageThumb}>
                  <img src={src} alt={`upload-${i}`} />
                  <button type="button" className={styles.removeImg} onClick={() => removeImage(i)} disabled={loading}>✕</button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.tagArea}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                #{tag}
                <button type="button" className={styles.tagRemove} onClick={() => removeTag(tag)} disabled={loading}>✕</button>
              </span>
            ))}
            <input
              className={styles.tagInput}
              placeholder="Add tag... (Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              disabled={loading}
            />
          </div>

          <div className={styles.bottomBar}>
            <div className={styles.toolBtns}>
              <button type="button" className={styles.toolBtn} onClick={() => fileInputRef.current?.click()} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Photo
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} onChange={handleImageChange} disabled={loading} />

              <button type="button" className={styles.toolBtn} onClick={() => document.querySelector<HTMLInputElement>(`.${styles.tagInput}`)?.focus()} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                  <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                Tag
              </button>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.cancelBtn} onClick={handleClose} disabled={loading}>Cancel</button>
              <button type="button" className={styles.postBtn} disabled={!text.trim() || loading} onClick={handlePost}>
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}