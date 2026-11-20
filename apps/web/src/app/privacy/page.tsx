import type { Metadata } from 'next';
import { BackButton } from '@/components/ui/BackButton';
import styles from './privacy.module.css';

export const metadata: Metadata = { title: 'Privacy | iatrome' };

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <BackButton href="/" />
      <h1>Privacy</h1>
      <p>Short version: we know very little about you, and we would like to keep it that way.</p>

      <h2>What we count</h2>
      <p>
        Page visits and site speed, through Vercel Web Analytics and Speed Insights. They don’t use cookies and don’t
        identify you. We see things like how many people visited and which pages loaded slowly.
      </p>

      <h2>What a game keeps</h2>
      <p>
        The name you type, your answers and drawings live in the room while you play. Rooms are deleted 30 minutes after
        everyone leaves. Your phone keeps a random ID so you can rejoin after a dropped connection, and so a host can ban a
        troll. Don’t type real patient details into the game. We mean it.
      </p>

      <h2>Cookies and ads</h2>
      <p>
        iatrome is free. One day it may show the occasional ad, never during play. If it does, we’ll ask first, and ad
        cookies load only if you say yes. Your answer is saved in one cookie, <code>iatrome_consent</code>, so we don’t
        keep asking.
      </p>

      <h2>Questions</h2>
      <p>Use the contact details on iatrome.com. We’ll answer, slowly but honestly.</p>
    </main>
  );
}
