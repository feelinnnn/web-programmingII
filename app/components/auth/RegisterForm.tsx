'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SocialButtons from './SocialButtons';
import styles from './RegisterForm.module.css';

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      router.push(`/auth-app/verify-otp?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&purpose=register`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
          required
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
          disabled={loading}
          required
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
          disabled={loading}
          required
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
          disabled={loading}
          required
        />
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Sending OTP...' : 'Sign up'}
      </button>

      <SocialButtons mode="signup" />
    </form>
  );
}