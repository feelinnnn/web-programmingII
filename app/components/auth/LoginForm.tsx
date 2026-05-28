'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SocialButtons from './SocialButtons';
import styles from './LoginForm.module.css';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login-step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      router.push(`/auth-app/verify-otp?email=${encodeURIComponent(email)}&purpose=login`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={doLogin} className={styles.form}>
      <h1 className={styles.title}>Login</h1>
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
        <div className={styles.forgotBlock}>
          <Link href="/forgot-password" className={styles.forgotLink}>
            Forgot Password?
          </Link>
        </div>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Processing...' : 'Sign in'}
      </button>

      <SocialButtons mode="signin" />
    </form>
  );
}