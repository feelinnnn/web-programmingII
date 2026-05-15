import Link from 'next/link';
import styles from './PanelContent.module.css';

interface PanelContentProps {
  title: string;
  subtitle?: string;
  linkLabel: string;
  linkHref: string;
  linkText: string;
}

export default function PanelContent({
  title,
  subtitle,
  linkLabel,
  linkHref,
  linkText,
}: PanelContentProps) {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={styles.divider} />
      <p className={styles.linkLabel}>{linkLabel}</p>
      <Link href={linkHref} className={styles.linkBtn}>
        {linkText}
      </Link>
    </div>
  );
}
