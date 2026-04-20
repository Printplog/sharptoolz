import { Component, type ErrorInfo, type ReactNode } from "react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
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

      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

      return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 font-sans">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/[0.03] border border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl space-y-8">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                  <AlertTriangle size={32} />
                </div>

                <div className="space-y-2">
                  <h1 className="text-xl font-bold text-white tracking-tight uppercase italic italic-primary">
                    System <span className="text-primary">Pause</span>
                  </h1>
                  <p className="text-white/40 text-xs leading-relaxed max-w-[200px] mx-auto font-medium">
                    Something went wrong while processing your request.
                  </p>
                </div>
              </div>

              {/* Technical Trace - ONLY ON LOCALHOST */}
              {isLocal && (
                <div className="w-full bg-black/20 rounded-2xl p-5 border border-white/5">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-2 opacity-60">
                    Technical Trace (Localhood)
                  </p>
                  <code className="text-[10px] font-mono text-white/30 break-words block h-16 overflow-y-auto custom-scrollbar italic">
                    {this.state.error?.message || "Internal React Error"}
                  </code>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleRetry}
                  className="group flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 px-6 rounded-2xl transition-all border border-white/10 active:scale-[0.98]"
                >
                  <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500 text-primary" />
                  <span className="text-[11px] uppercase tracking-widest">Restart Interface</span>
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 text-white/20 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                  <Home size={12} />
                  <span>Return Home</span>
                </button>
              </div>
            </div>

            <p className="mt-8 text-[9px] text-white/5 text-center uppercase tracking-[0.4em] font-black italic">
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
