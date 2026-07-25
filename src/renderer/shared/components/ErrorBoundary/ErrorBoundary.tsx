import { Component } from 'react';

interface ErrorBoundaryProps {
  readonly children: React.ReactNode;
  readonly fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-error)' }}>
            error
          </span>
          <h3 style={{ margin: '12px 0 8px', color: 'var(--color-on-surface)' }}>Something went wrong</h3>
          <p style={{ margin: '0 0 12px', color: 'var(--color-on-surface-variant)', fontSize: 13 }}>
            {this.state.error?.message}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              padding: '6px 16px',
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
