import styles from './Backdrop.module.css';

/** Soft, slowly drifting palette blobs behind the page. Pure CSS — no JS cost. */
export function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden>
      <span className={`${styles.blob} ${styles.sky}`} />
      <span className={`${styles.blob} ${styles.gold}`} />
      <span className={`${styles.blob} ${styles.rose}`} />
      <span className={`${styles.blob} ${styles.cool}`} />
    </div>
  );
}
