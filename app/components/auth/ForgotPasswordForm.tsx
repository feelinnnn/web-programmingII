'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './RegisterForm.module.css';
import { validateEmail } from '@/lib/validation';
import Swal from 'sweetalert2';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const emailErr = validateEmail(email);
    if (emailErr) {
      setErrors({ email: emailErr });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ email: data.message || 'Something went wrong' });
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'OTP Sent!',
        text: 'Please check your email for the verification code.',
        timer: 2000,
        showConfirmButton: false,
      });

      sessionStorage.setItem('auth_email', email);
      sessionStorage.setItem('auth_purpose', 'forgot_password');
      router.push('/auth-app/verify-otp');

    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h1 className={styles.title}>Forgot Password</h1>
      <p className={styles.label} style={{ marginBottom: '10px' }}>
        Enter your email address and we&apos;ll send you a code to reset your password.
      </p>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
        {errors.general && <div className={styles.errorMessage}>{errors.general}</div>}
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </form>
  );
}
