import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F4F5] dark:bg-[#0D0D0E] text-neutral-950 dark:text-neutral-100">
          <div className="max-w-md w-full rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#171719] p-6 shadow-xl text-center space-y-4">
            <h2 className="font-display text-2xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              We hit an unexpected issue loading Karachi Brasserie. Please refresh the page to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-neutral-950 dark:bg-white text-white dark:text-neutral-950 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
