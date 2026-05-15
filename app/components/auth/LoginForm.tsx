'use client';

import { useState } from 'react';
import Link from 'next/link';
import SocialButtons from './SocialButtons';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Login</h1>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
        <div className={styles.forgotWrapper}>
          <Link href="/forgot-password" className={styles.forgotLink}>
            Forgot Password?
          </Link>
        </div>
      </div>

      <button type="submit" className={styles.submitBtn}>
        Sign in
      </button>

      <SocialButtons mode="signin" />
    </form>
  );
}
