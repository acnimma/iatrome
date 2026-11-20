import styles from './Jelly.module.css';

export type JellyTone = 'black' | 'pearl' | 'rose' | 'blue' | 'sky' | 'gold' | 'green';

/** Class names for the glossy jelly finish (see Jelly.module.css). Black is the house default. */
export const jelly = (tone: JellyTone = 'black') => `${styles.jelly} ${styles[tone]}`;
