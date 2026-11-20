import styles from './Backdrop.module.css';

/** Warm white with a soft, warm vignette at the edges. Static, pure CSS. */
export function Backdrop() {
  return <div className={styles.backdrop} aria-hidden />;
}
