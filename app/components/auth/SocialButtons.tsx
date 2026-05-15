import styles from './SocialButtons.module.css';

interface SocialButtonsProps {
  mode: 'signin' | 'signup';
}

export default function SocialButtons({ mode }: SocialButtonsProps) {
  const label = mode === 'signin' ? 'Sign in with' : 'Sign up with';

  return (
    <div className={styles.wrapper}>
      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>Or</span>
        <span className={styles.dividerLine} />
      </div>

      <button type="button" className={styles.socialBtn}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google Logo" width="20" height="20" />
      {label} Google
    </button>

    <button type="button" className={styles.socialBtn}>
      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook Logo" width="20" height="20" />
      {label} Facebook
    </button>
    </div>
  );
}
