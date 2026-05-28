import styles from './SocialButtons.module.css';

type Props = { mode: 'signin' | 'signup' };

export default function SocialButtons({ mode }: Props) {
  const isSignIn = mode === 'signin';

  return (

    <div className={styles.container}>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>Or</span>
        <span className={styles.dividerLine} />
      </div>

      <button type="button" className={styles.socialBtn}>
        <img src="https://www.gstatic.com/images/branding/product/2x/googleg_96dp.png" alt="Google" width="20" height="20" />
        Sign {isSignIn ? 'in' : 'up'} with Google
      </button>
    </div>
  );
}