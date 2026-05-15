'use client';

import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  panelSide: 'left' | 'right';
  panelContent: React.ReactNode;
  formContent: React.ReactNode;
}

export default function AuthLayout({ panelSide, panelContent, formContent }: AuthLayoutProps) {
  return (
    <div className={styles.container}>
      {panelSide === 'left' ? (
        <>
          <div className={`${styles.panel} ${styles.panelLeft}`}>
            <div className={styles.circle} />
            <div className={styles.panelInner}>{panelContent}</div>
          </div>
          <div className={styles.formSection}>{formContent}</div>
        </>
      ) : (
        <>
          <div className={styles.formSection}>{formContent}</div>
          <div className={`${styles.panel} ${styles.panelRight}`}>
            <div className={styles.circle} />
            <div className={styles.panelInner}>{panelContent}</div>
          </div>
        </>
      )}
    </div>
  );
}
