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
        <div className="flex min-h-[460px] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-8 ring-rose-50/60">
            <AlertTriangle size={30} />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">Something went wrong</h2>
          <p className="mt-2.5 max-w-md text-sm leading-relaxed text-slate-500">
            An unexpected error occurred while rendering this view.
          </p>
          {this.state.error?.message && (
            <pre className="mt-4 max-w-lg overflow-x-auto rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-xs text-rose-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReset}
            className="btn-primary mt-7 inline-flex items-center gap-2"
          >
            <RefreshCw size={15} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
