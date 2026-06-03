'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SocialButtons from './SocialButtons';
import styles from './RegisterForm.module.css';
import { validateEmail, validatePassword, validateUsername } from '@/lib/validation';

export default function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const doRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: any = {};
    
    const emailErr = validateEmail(email);
    if (emailErr) newErrors.email = emailErr;

    const usernameErr = validateUsername(username);
    if (usernameErr) newErrors.username = usernameErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) newErrors.password = passwordErr;

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match!";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
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
        // If the backend returns field-specific errors, map them
        if (data.errors) {
          setErrors(data.errors);
        } else {
          // Handle specific known messages from backend
          if (data.message?.toLowerCase().includes('email')) {
            setErrors({ email: data.message });
          } else if (data.message?.toLowerCase().includes('username')) {
            setErrors({ username: data.message });
          } else {
            setErrors({ general: data.message || 'Something went wrong' });
          }
        }
        return;
      }

      router.push(`/auth-app/verify-otp?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}&purpose=register`);

    } catch (err: any) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    const err = validateUsername(val);
    setErrors(prev => ({ ...prev, username: err || undefined, general: undefined }));
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    const err = validateEmail(val);
    setErrors(prev => ({ ...prev, email: err || undefined, general: undefined }));
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    const err = validatePassword(val);
    // Only show mismatch error if confirm field has been touched/filled
    const confirmErr = (confirmPassword && val !== confirmPassword) ? "Passwords don't match!" : undefined;
    setErrors(prev => ({ 
      ...prev, 
      password: err || undefined, 
      confirmPassword: confirmErr,
      general: undefined 
    }));
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    const err = (val && val !== password) ? "Passwords don't match!" : undefined;
    setErrors(prev => ({ ...prev, confirmPassword: err, general: undefined }));
  };

  return (
    <form onSubmit={doRegister} className={styles.form}>
      <h1 className={styles.title}>Create Account</h1>

      {errors.general && <div className={styles.errorMessage} style={{ textAlign: 'center', marginBottom: '10px' }}>{errors.general}</div>}

      <div className={styles.field}>
        <label className={styles.label}>Username</label>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          className={`${styles.input} ${errors.username ? styles.inputError : ''}`}
          disabled={loading}
        />
        {errors.username && <div className={styles.errorMessage}>{errors.username}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Example@email.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
          disabled={loading}
        />
        {errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
          disabled={loading}
        />
        {errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Confirm Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
          disabled={loading}
        />
        {errors.confirmPassword && <div className={styles.errorMessage}>{errors.confirmPassword}</div>}
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Sending OTP...' : 'Sign up'}
      </button>

      <SocialButtons mode="signup" />
    </form>
  );
}
