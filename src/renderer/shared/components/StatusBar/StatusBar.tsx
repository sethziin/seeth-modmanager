import styles from './StatusBar.module.css';

export function StatusBar(): React.ReactElement {
  return (
    <footer className={styles.statusBar}>
      <div className={styles.left}>
        <div className={styles.statusIndicator}>
          <div className={styles.statusDot} />
          Ready
        </div>
      </div>
      <div className={styles.right}>
        <span className={styles.copyright}>Seeth's Mod Manager</span>
        <span className={styles.version}>v0.1.0</span>
      </div>
    </footer>
  );
}
