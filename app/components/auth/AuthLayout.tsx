'use client';

import styles from './AuthLayout.module.css';

interface Props {
  panelSide: 'left' | 'right';
  panelContent: React.ReactNode;
  formContent: React.ReactNode;
}

export default function AuthLayout({ panelSide, panelContent, formContent }: Props) {
  return (
    <div className={`${styles.container} ${styles[panelSide]}`}>
      
      <div className={styles.panel}>
        <div className={styles.circle} />
        <div className={styles.panelInner}>
          {panelContent}
        </div>
      </div>

      <div className={styles.formSection}>
        {formContent}
      </div>
    </div>
  );
}