'use client';

import { useState } from 'react';
import styles from './CreatePost.module.css';

interface CreatePostProps {
  userAvatar?: string;
}

export default function CreatePost({ userAvatar }: CreatePostProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatarWrap}>
        {userAvatar ? (
          <img src={userAvatar} alt="avatar" className={styles.avatar} />
        ) : (
          <div className={styles.avatarPlaceholder}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#a08060">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
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
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={() => { setOpen(false); setText(''); }}>
              Cancel
            </button>
            <button className={styles.postBtn}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}
