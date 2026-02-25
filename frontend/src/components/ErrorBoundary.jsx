import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ Error caught:", error, errorInfo);
    this.setState({ error, errorInfo });

    // You can log to an error tracking service here
    // if (window.Sentry) Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-black text-white p-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 max-w-md text-center border border-white/10">
            <div className="text-6xl mb-4 animate-bounce">😵</div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-6">
              Don't worry, it's not you, it's us. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition"
            >
              🔄 Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-6 text-left">
                <details className="text-xs text-red-400 bg-red-950/30 p-3 rounded-lg">
                  <summary className="cursor-pointer font-bold">Error Details</summary>
                  <pre className="mt-2 overflow-auto">
                    {this.state.error?.toString()}
                    {'\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;