import Link from 'next/link';
import styles from './PanelContent.module.css';

interface Props {
  title: string;
  subtitle?: string;
  linkLabel: string;
  link: {
    href: string;
    text: string;
  };
}

export default function PanelContent({ title, subtitle, linkLabel, link }: Props) {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      
      <div className={styles.divider} />
      
      <p className={styles.linkLabel}>{linkLabel}</p>

      <Link href={link.href} className={styles.linkBtn}>{link.text}</Link>   
    </div>
  );
}