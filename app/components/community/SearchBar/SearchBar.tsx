'use client';

import { useState } from 'react';
import styles from './SearchBar.module.css';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={styles.input}
      />
      <button className={styles.iconBtn} aria-label="Search">
        <img 
          src="/icon/search-icon.png" 
          alt="Search Icon"
          className={styles.searchimg} 
        />
      </button>
    </div>
  );
}
