import { Wordmark } from '@/components/brand/Wordmark';
import { Backdrop } from '@/components/coming-soon/Backdrop';
import styles from './page.module.css';

export default function ComingSoonPage() {
  return (
    <main className={styles.page}>
      <Backdrop />
      <h1 className={styles.logo}>
        <Wordmark />
      </h1>
      <p className={styles.say} aria-label="Pronounced EYE-uh-trohm">
        /ˈaɪ.ə.troʊm/
      </p>
      <p className={styles.soon}>coming soon</p>
    </main>
  );
}
