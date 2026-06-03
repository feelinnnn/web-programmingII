'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SocialButtons from './SocialButtons';
import styles from './LoginForm.module.css';
import { validateEmail } from '@/lib/validation';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // เก็บ errors แยกตาม field
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); // ล้าง error เก่าก่อนเริ่มใหม่

    // Client-side validation
    const newErrors: any = {};
    
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;
    
    if (!password) {
      newErrors.password = "Password is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ถ้าผ่านการตรวจ เริ่มยิง API
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login-step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          // Handle specific known messages from backend
          if (data.message?.toLowerCase().includes('email')) {
            setErrors({ email: data.message });
          } else if (data.message?.toLowerCase().includes('password')) {
            setErrors({ password: data.message });
          } else {
            setErrors({ general: data.message || 'Invalid email or password' });
          }
        }
        return;
      }

      router.push(`/auth-app/verify-otp?email=${encodeURIComponent(email)}&purpose=login`);
    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={doLogin} className={styles.form}>
      <h1 className={styles.title}>Login</h1>
      
      {/* แจ้งเตือนข้อผิดพลาดจาก Server (General Error) */}
      {errors.general && <div className={styles.errorMessage} style={{textAlign: 'center', marginBottom: '10px'}}>{errors.general}</div>}

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          disabled={loading}
        />
        {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
          disabled={loading}
        />
        {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
        
        <div className={styles.forgotBlock}>
          <Link href="/forgot-password" className={styles.forgotLink}>Forgot Password?</Link>
        </div>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Processing...' : 'Sign in'}
      </button>

      <SocialButtons mode="signin" />
    </form>
  );
} 
