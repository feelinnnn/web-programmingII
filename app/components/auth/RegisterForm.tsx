'use client';

import { useState } from 'react';
import SocialButtons from './SocialButtons';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Register</h1>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Username</label>
        <input
          name="username"
          type="text"
          placeholder="Enter your username"
          value={form.username}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Email</label>
        <input
          name="email"
          type="email"
          placeholder="Example@email.com"
          value={form.email}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Password</label>
        <input
          name="password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Confirm Password</label>
        <input
          name="confirmPassword"
          type="password"
          placeholder="At least 8 characters"
          value={form.confirmPassword}
          onChange={handleChange}
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
