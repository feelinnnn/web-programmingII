'use client';

import { useState, Suspense , useEffect} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './RegisterForm.module.css';
import { validatePassword } from '@/lib/validation';
import Swal from 'sweetalert2';

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('auth_email');
    const storedToken = sessionStorage.getItem('auth_token');

    if (storedEmail) setEmail(storedEmail);
    else setEmail(searchParams.get('email') || '');

    if (storedToken) setToken(storedToken);
    else setToken(searchParams.get('token') || '');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const passwordErr = validatePassword(password);
    const confirmErr = (password !== confirmPassword) ? "Passwords don't match!" : null;

    if (passwordErr || confirmErr) {
      setErrors({ 
        password: passwordErr || undefined, 
        confirmPassword: confirmErr || undefined 
      });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const fieldErrors: any = {};
          data.errors.forEach((err: any) => {
            if (err.source?.pointer) {
              const field = err.source.pointer.split('/').pop();
              fieldErrors[field] = err.detail;
            } else {
              fieldErrors.general = err.detail;
            }
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: 'Something went wrong' });
        }
        return;
      }

      await Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: data.data.attributes.message || 'Your password has been reset successfully. You can now login.',
        confirmButtonText: 'Go to Login',
        confirmButtonColor: '#3b1f1f',
      });

      // Clean up sessionStorage
      sessionStorage.removeItem('auth_email');
      sessionStorage.removeItem('auth_token');

      router.push('/auth-app/login');

    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!email || !token) {
    return (
        <div className={styles.form}>
            <h1 className={styles.title}>Invalid Link</h1>
            <p className={styles.label}>This password reset link is invalid or has expired.</p>
            <button onClick={() => router.push('/auth-app/forgot-password')} className={styles.submitBtn}>
                Request New Link
            </button>
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <h1 className={styles.title}>Reset Password</h1>
      <p className={styles.label} style={{ marginBottom: '10px' }}>
        Enter your new password below.
      </p>

      <div className={styles.field}>
        <label className={styles.label}>New Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Confirm New Password</label>
        <input
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {errors.confirmPassword && <div className={styles.errorMessage}>{errors.confirmPassword}</div>}
        {errors.general && <div className={styles.errorMessage}>{errors.general}</div>}
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordFormContent />
        </Suspense>
    );
}
