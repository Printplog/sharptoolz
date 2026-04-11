import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, Home, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary — Catches JS errors anywhere in their child component tree,
 * logs those errors, and displays a premium fallback UI instead of the component tree that crashed.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Uncaught error]:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans selection:bg-indigo-500/30">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md relative"
          >
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-indigo-500/20 rounded-4xl blur-2xl opacity-50" />
            
            <div className="relative bg-zinc-900/90 border border-white/5 backdrop-blur-xl rounded-4xl p-8 shadow-2xl overflow-hidden">
              {/* Decorative Header */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/50 via-indigo-500/50 to-red-500/50 opacity-30" />
              
              <div className="flex flex-col items-center text-center gap-6">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"
                  >
                    <ShieldAlert size={40} />
                  </motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-4 border-zinc-900"
                  />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    Unexpected Hiccup
                  </h1>
                  <p className="text-zinc-400 text-sm leading-relaxed px-4">
                    Our document intelligence hit a temporary roadblock. Don't worry, your work is usually saved automatically.
                  </p>
                </div>

                {/* Error Details (Only visible in dev or if expanded) */}
                {process.env.NODE_ENV === "development" && (
                  <div className="w-full bg-black/40 rounded-xl p-4 text-left border border-white/5 overflow-hidden">
                    <p className="text-[10px] font-mono text-red-400/80 truncate mb-1 uppercase tracking-widest font-bold">
                      Technical Trace
                    </p>
                    <code className="text-[11px] font-mono text-zinc-500 break-words block h-12 overflow-y-auto custom-scrollbar">
                      {this.state.error?.message || "Internal React Error"}
                    </code>
                  </div>
                )}

                <div className="flex flex-col w-full gap-3 pt-2">
                  <button
                    onClick={this.handleRetry}
                    className="group relative flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                  >
                    <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span>Try Refreshing</span>
                  </button>
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium py-3 px-6 rounded-xl transition-all border border-white/5"
                  >
                    <Home size={16} />
                    <span>Back to Home</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-8 text-[10px] text-zinc-600 text-center uppercase tracking-[0.2em] font-medium">
              SharpToolz Intelligence Protection
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
