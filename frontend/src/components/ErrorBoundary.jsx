import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary caught an error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/80 flex items-center justify-center text-3xl shadow-sm mx-auto mb-5">
              ⚠️
            </div>
            <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-rose-50 text-rose-600 tracking-wider">
              Application Notice
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">
              Something went sideways
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              An unexpected render issue occurred. Refreshing the cabin usually resolves this immediately.
            </p>

            {this.state.error?.message && (
              <div className="mt-4 p-3.5 bg-slate-50 rounded-xl text-left border border-slate-200/60 overflow-x-auto">
                <p className="text-xs font-mono text-rose-600 font-medium">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all cursor-pointer"
              >
                Clear Cache &amp; Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
