import React from 'react';

type State = { error: Error | null };

/**
 * Last line of defence: an uncaught render error anywhere above the panel-level
 * boundaries would otherwise unmount the whole tree and leave a blank screen.
 * Shows a recovery card instead; the career save is untouched.
 */
export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AppErrorBoundary caught a render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main
        role="alert"
        className="grid min-h-[100dvh] place-items-center bg-[#0e0c0a] p-6 text-center text-[#f3ecdd]"
      >
        <div className="max-w-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#e6b866]">Console fault</p>
          <h1 className="mt-2 text-2xl font-bold">The studio tripped a breaker</h1>
          <p className="mt-2 text-sm opacity-80">Your career save is safe. Reload to get back to the studio.</p>
          <button
            type="button"
            className="mt-5 min-h-[44px] rounded-xl border border-[#e6b866]/60 px-6 font-bold"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </main>
    );
  }
}

export default AppErrorBoundary;
