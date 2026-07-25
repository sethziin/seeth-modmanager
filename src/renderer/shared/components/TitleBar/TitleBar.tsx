import styles from './TitleBar.module.css';

export function TitleBar(): React.ReactElement {
  const handleMinimize = (): void => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = (): void => {
    window.electronAPI.window.maximize();
  };

  const handleClose = (): void => {
    window.electronAPI.window.close();
  };

  return (
    <div className={styles.titleBar}>
      <div className={styles.brand}>Seeth's Mod Manager</div>
      <div className={styles.windowControls}>
        <button className={styles.windowBtn} onClick={handleMinimize} title="Minimize">
          <span className="material-symbols-outlined">minimize</span>
        </button>
        <button className={styles.windowBtn} onClick={handleMaximize} title="Maximize">
          <span className="material-symbols-outlined">fullscreen</span>
        </button>
        <button
          className={`${styles.windowBtn} ${styles.windowBtnClose}`}
          onClick={handleClose}
          title="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}
