import '../shared/styles/variables.css';
import '../shared/styles/reset.css';
import '../shared/styles/typography.css';
import '../shared/styles/scrollbar.css';
import '../shared/styles/animations.css';
import '../shared/styles/icons.css';
import { AppRouter } from './router';
import { IpcListenerProvider } from './IpcListenerProvider';
import { DragDropProvider } from './DragDropProvider';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { ToastContainer } from '../shared/components/Toast';

export function App(): React.ReactElement {
  return (
    <ErrorBoundary>
      <IpcListenerProvider>
        <DragDropProvider>
          <AppRouter />
          <ToastContainer />
        </DragDropProvider>
      </IpcListenerProvider>
    </ErrorBoundary>
  );
}
