import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

/**
 * Error boundary — monochrome, clean.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Renderer crash:', error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <pre className="text-[10px] text-muted select-none">{`
  ┌─────────────────────┐
  │   !! ERROR !!       │
  │                     │
  └─────────────────────┘`}</pre>
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-primary">
            Something went wrong
          </h2>
          <p className="mt-1.5 max-w-md text-xs text-text-secondary">
            {this.state.message || 'An unexpected error occurred.'}
          </p>
        </div>
        <button onClick={this.reset} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }
}