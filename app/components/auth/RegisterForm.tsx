'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SocialButtons from './SocialButtons';
import styles from './RegisterForm.module.css';
import { validateEmail, validatePassword, validateUsername } from '@/lib/validation';
import Swal from 'sweetalert2';

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
  const [touched, setTouched] = useState<{
    username?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});
  const [loading, setLoading] = useState(false);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'username':
        return validateUsername(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return (value && value !== password) ? "Passwords don't match!" : null;
      default:
        return null;
    }
  };

  const doRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mark all as touched
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    // Client-side validation
    const newErrors: any = {};
    const emailErr = validateEmail(email);
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);
    const confirmErr = (password !== confirmPassword) ? "Passwords don't match!" : null;

    if (emailErr) newErrors.email = emailErr;
    if (usernameErr) newErrors.username = usernameErr;
    if (passwordErr) newErrors.password = passwordErr;
    if (confirmErr) newErrors.confirmPassword = confirmErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
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
        title: 'OTP Sent!',
        text: data.data.attributes.message || 'Please check your email for the verification code.',
        timer: 2000,
        showConfirmButton: false,
      });

      sessionStorage.setItem('auth_email', email);
      sessionStorage.setItem('auth_purpose', 'register');
      router.push('/auth-app/verify-otp');

    } catch (err: any) {
      setErrors({ email: err.message, username: err.message, password: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: undefined, general: undefined }));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined, general: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password || errors.confirmPassword) {
      setErrors(prev => ({ ...prev, password: undefined, confirmPassword: undefined, general: undefined }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined, general: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let val = '';
    if (field === 'username') val = username;
    else if (field === 'email') val = email;
    else if (field === 'password') val = password;
    else if (field === 'confirmPassword') val = confirmPassword;

    const err = validateField(field, val);
    setErrors(prev => ({ ...prev, [field]: err || undefined }));
  };

  return (
    <form onSubmit={doRegister} className={styles.form} noValidate>
      <h1 className={styles.title}>Create Account</h1>

      <div className={styles.field}>
        <label className={styles.label}>Username</label>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          onBlur={() => handleBlur('username')}
          className={`${styles.input} ${touched.username && errors.username ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {touched.username && errors.username && <div className={styles.errorMessage}>{errors.username}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <input
          type="email"
          placeholder="Example@email.com"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={() => handleBlur('email')}
          className={`${styles.input} ${touched.email && errors.email ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {touched.email && errors.email && <div className={styles.errorMessage}>{errors.email}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          onBlur={() => handleBlur('password')}
          className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {touched.password && errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Confirm Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={confirmPassword}
          onChange={(e) => handleConfirmPasswordChange(e.target.value)}
          onBlur={() => handleBlur('confirmPassword')}
          className={`${styles.input} ${touched.confirmPassword && errors.confirmPassword ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {touched.confirmPassword && errors.confirmPassword && <div className={styles.errorMessage}>{errors.confirmPassword}</div>}
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Sending OTP...' : 'Sign up'}
      </button>

      <SocialButtons mode="signup" />
    </form>
  );
}
