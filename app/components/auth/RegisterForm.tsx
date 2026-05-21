'use client';

import { useState } from 'react';
import SocialButtons from './SocialButtons';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const doRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    console.log({ username, email, password });
  };

  return (
    <form onSubmit={doRegister} className={styles.form}>
      <h1 className={styles.title}>Create Account</h1>

      <div className={styles.field}>
        <label className={styles.label}>Username</label>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Confirm Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={styles.input}
        />
      </div>

      <button type="submit" className={styles.submitBtn}>
        Sign up
      </button>

      <SocialButtons mode="signup" />
    </form>
  );
}