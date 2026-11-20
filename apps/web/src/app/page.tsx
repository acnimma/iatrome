import Link from 'next/link';
import { Wordmark } from '@/components/brand/Wordmark';
import { Backdrop } from '@/components/ui/Backdrop';
import { JoinCodeForm } from '@/components/home/JoinCodeForm';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.page}>
      <Backdrop />
      <h1 className={styles.logo}>
        <Wordmark className={styles.wordmark} />
      </h1>
      <p className={styles.say} aria-label="Pronounced EYE-uh-trohm">
        eye-uh-trohm
      </p>
      <p className={styles.tagline}>The party game that speaks fluent medicine.</p>
      <JoinCodeForm />
      <p className={styles.host}>
        Somebody has to be in charge. <Link href="/host">Host a game →</Link>
      </p>
      <footer className={styles.footer}>Free to play · Just phones, or phones and a big screen · Punches at medicine, never at patients</footer>
    </main>
  );
}
