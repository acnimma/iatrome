import Link from 'next/link';
import { Wordmark } from '@/components/brand/Wordmark';
import { JoinCodeForm } from '@/components/home/JoinCodeForm';
import { jelly } from '@/components/ui/jelly';
import { AdSlot } from '@/components/ads/AdSlot';
import buttons from '@/components/ui/Button.module.css';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.logo}>
        <Wordmark className={styles.wordmark} />
      </h1>
      <p className={styles.say} aria-label="Pronounced EYE-uh-trohm">
        eye-uh-trohm
      </p>
      <p className={styles.tagline}>The party game that speaks fluent medicine.</p>
      <JoinCodeForm />
      <Link href="/host" className={`${buttons.button} ${buttons.xl} ${jelly('pearl')} ${styles.host}`}>
        Host a game
      </Link>
      <AdSlot placement="home" />
    </main>
  );
}
