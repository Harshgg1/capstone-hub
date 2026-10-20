import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
          <div className="rounded-full bg-rose-50 p-4 text-rose-500 ring-8 ring-rose-50/50">
            <AlertTriangle size={32} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-800">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            An unexpected error occurred while rendering this view.
          </p>
          {this.state.error?.message && (
            <pre className="mt-3 max-w-lg overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-rose-600">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="btn-primary mt-6 inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
