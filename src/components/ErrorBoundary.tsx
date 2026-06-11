import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

/**
 * Top-level React error boundary. Prevents a render-time exception in any page
 * from blanking the whole window; shows a recoverable error screen instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Renderer crash:', error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15">
          <AlertTriangle className="h-8 w-8 text-rose-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-1 max-w-md text-sm text-muted">{this.state.message || 'An unexpected error occurred.'}</p>
        </div>
        <button onClick={this.reset} className="btn-primary">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }
}
