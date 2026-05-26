'use client';

import { useState } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <div className={styles.wrapper}>
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.input}
      />
      <button className={styles.iconBtn} aria-label="Search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  );
}
