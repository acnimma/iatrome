import { Wordmark } from '@/components/brand/Wordmark';
import styles from './page.module.css';

export default function ComingSoonPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.logo}>
        <Wordmark className={styles.wordmark} />
      </h1>
      <p className={styles.say} aria-label="Pronounced EYE-uh-trohm">
        eye-uh-trohm
      </p>
      <p className={styles.soon}>coming soon</p>
    </main>
  );
}
