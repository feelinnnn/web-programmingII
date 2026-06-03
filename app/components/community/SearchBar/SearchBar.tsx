'use client';

import { useState } from 'react';
import styles from './SearchBar.module.css';

interface Props {
  onSearch?: (query: string) => void;
}

export default function SearchBar({ onSearch }: Props) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch?.(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className={styles.container}>
      <input
        type="text"
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className={styles.input}
      />
      <button className={styles.iconBtn} aria-label="Search" onClick={handleSearch}>
        <img
          src="/icon/search-icon.png"
          alt="Search Icon"
          className={styles.searchimg}
        />
      </button>
    </div>
  );
}
