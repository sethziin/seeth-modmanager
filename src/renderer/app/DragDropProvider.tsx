import { useState, useCallback, useEffect } from 'react';
import { toast } from '../shared/components/Toast';
import { useGameStore } from '../shared/stores/useGameStore';
import { useModStore } from '../shared/stores/useModStore';
import styles from './DragDropOverlay.module.css';

export function DragDropProvider({ children }: { readonly children: React.ReactNode }): React.ReactElement {
  const [dragging, setDragging] = useState(false);
  const dragCounterRef = useState(0);
  const games = useGameStore((s) => s.games);
  const installMod = useModStore((s) => s.installMod);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef[0]++;
    if (e.dataTransfer?.types.includes('Files')) {
      setDragging(true);
    }
  }, [dragCounterRef]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounterRef[0]--;
    if (dragCounterRef[0] === 0) {
      setDragging(false);
    }
  }, [dragCounterRef]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      dragCounterRef[0] = 0;

      if (!e.dataTransfer) return;

      const files = Array.from(e.dataTransfer.files);
      const archives = files.filter(
        (f) => f.name.endsWith('.zip') || f.name.endsWith('.7z') || f.name.endsWith('.rar'),
      );

      if (archives.length === 0) {
        toast('warning', 'Arquivos inválidos', 'Solte apenas .zip, .7z ou .rar.');
        return;
      }

      const availableGames = games.filter((g) => g.installPath);
      if (availableGames.length === 0) {
        toast('warning', 'Nenhum jogo detectado', 'Detecte ou configure um jogo primeiro.');
        return;
      }

      for (const archive of archives) {
        const gameId = availableGames.length === 1
          ? availableGames[0]!.id
          : availableGames[0]!.id;

        toast('info', 'Instalando', `${archive.name}...`);

        try {
          const result = await installMod(gameId, archive.path);
          toast('success', 'Instalado', `${result.name} v${result.version}`);
        } catch (err) {
          toast('error', 'Falha na instalação', String(err));
        }
      }
    },
    [games, installMod, dragCounterRef],
  );

  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  return (
    <>
      {children}
      {dragging && (
        <div className={styles.overlay}>
          <div className={styles.content}>
            <span className={`${styles.icon} material-symbols-outlined`}>upload_file</span>
            <div className={styles.title}>Solte o Mod Archive</div>
            <div className={styles.subtitle}>.zip, .7z ou .rar</div>
          </div>
        </div>
      )}
    </>
  );
}
