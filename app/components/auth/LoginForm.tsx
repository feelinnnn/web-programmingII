'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SocialButtons from './SocialButtons';
import styles from './LoginForm.module.css';
import { validateEmail } from '@/lib/validation';
import Swal from 'sweetalert2';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // เก็บ errors แยกตาม field
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [loading, setLoading] = useState(false);

  const validateField = (name: string, value: string) => {
    if (name === 'email') {
      return validateEmail(value);
    }
    if (name === 'password') {
      return value ? null : "Password is required.";
    }
    return null;
  };

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched on submit
    setTouched({ email: true, password: true });

    // Client-side validation
    const emailErr = validateEmail(email);
    const passwordErr = password ? null : "Password is required.";
    
    const newErrors: any = {};
    if (emailErr) newErrors.email = emailErr;
    if (passwordErr) newErrors.password = passwordErr;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // ล้าง error เก่าก่อนเริ่มใหม่
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
          // Map general error message to both fields
          const errMsg = data.message || 'Invalid email or password';
          setErrors({ 
            email: errMsg.toLowerCase().includes('password') ? undefined : errMsg,
            password: errMsg.toLowerCase().includes('email') ? undefined : errMsg,
            general: undefined 
          });
          
          // If it's a truly general error (doesn't mention either), show on both
          if (!errMsg.toLowerCase().includes('email') && !errMsg.toLowerCase().includes('password')) {
            setErrors({ email: errMsg, password: errMsg });
          }
        }
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
      sessionStorage.setItem('auth_purpose', 'login');
      router.push('/auth-app/verify-otp');
    } catch (err: any) {
      setErrors({ email: err.message, password: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (errors.email || errors.general) {
      setErrors(prev => ({ ...prev, email: undefined, general: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (errors.password || errors.general) {
      setErrors(prev => ({ ...prev, password: undefined, general: undefined }));
    }
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const val = field === 'email' ? email : password;
    const err = validateField(field, val);
    setErrors(prev => ({ ...prev, [field]: err || undefined }));
  };

  return (
    <form onSubmit={doLogin} className={styles.form} noValidate>
      <h1 className={styles.title}>Login</h1>
      
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          onBlur={() => handleBlur('password')}
          className={`${styles.input} ${touched.password && errors.password ? styles.inputError : ''}`}
          disabled={loading}
          autoComplete="off"
        />
        {touched.password && errors.password && <div className={styles.errorMessage}>{errors.password}</div>}
        
        <div className={styles.forgotBlock}>
          <Link href="/auth-app/forgot-password" className={styles.forgotLink}>Forgot Password?</Link>
        </div>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={loading}>
        {loading ? 'Processing...' : 'Sign in'}
      </button>

      <SocialButtons mode="signin" />
    </form>
  );
} 
