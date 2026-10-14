import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-md py-20 text-center px-4">
        <h2 className="text-xl font-semibold text-[var(--text)]">Trang này gặp sự cố</h2>
        <p className="mt-2 text-sm text-[var(--text-2)]">
          Bạn thử tải lại trang hoặc quay về trang chủ nhé.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 overflow-auto rounded-xl bg-[var(--surface-2)] p-3 text-left text-xs text-[var(--danger)] max-h-48">
            {this.state.error.message}
          </pre>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:bg-[var(--brand-700)] transition-colors cursor-pointer shadow-sm"
            onClick={() => this.setState({ error: null })}
          >
            Thử lại
          </button>
          <a
            className="px-4 py-2 rounded-xl bg-[var(--surface-2)] text-[var(--text-2)] text-sm font-semibold hover:bg-[var(--border)] transition-colors inline-block"
            href="/dashboard"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
