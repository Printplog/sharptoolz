import React, { useState, useEffect, useRef } from 'react';
import { useAdminConsoleStore } from '@/store/useAdminConsoleStore';
import { useAuthStore } from '@/store/authStore';
import { isAdmin, isAdminOrStaff } from '@/lib/constants/roles';
import { isAdminRoute } from '@/lib/utils/security/helpers';
import {
  ChevronDown,
  Trash2,
  Terminal,
  Maximize2,
  Minimize2,
  Info,
  AlertTriangle,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const AdminConsole: React.FC = () => {
  const { logs, clearLogs, isOpen, toggleOpen } = useAdminConsoleStore();
  const user = useAuthStore(state => state.user);
  const [isMaximized, setIsMaximized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const isAdminUser = isAdmin(user.role);
  const isStaffUser = isAdminOrStaff(user.role);
  const onAdminPage = isAdminRoute();

  if (isAdminUser || (isStaffUser && onAdminPage)) {
    // Show console
  } else {
    return null;
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-3 h-3 text-blue-400" />;
      case 'warn': return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-500" />;
      case 'success': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'table': return <Terminal className="w-3 h-3 text-purple-400" />;
      default: return <Terminal className="w-3 h-3 text-gray-400" />;
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[9999] font-mono text-xs transition-all duration-300 ease-in-out",
        isOpen
          ? (isMaximized ? "w-[480px] h-[60vh]" : "w-80 h-64")
          : "w-9 h-9"
      )}
    >
      {isOpen ? (
        /* Expanded panel */
        <div className="w-full h-full flex flex-col bg-black/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 h-8 shrink-0 border-b border-white/5 bg-black/80">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold uppercase tracking-wider text-[10px] text-white/60">Console</span>
              {logs.length > 0 && (
                <span className="bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full text-[9px] min-w-[18px] text-center">
                  {logs.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-white hover:bg-white/10"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-red-400 hover:bg-red-400/10"
                onClick={clearLogs}
                title="Clear Logs"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-500 hover:text-white hover:bg-white/10"
                onClick={toggleOpen}
                title="Close"
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Logs */}
          <div
            ref={scrollRef}
            className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
          >
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-1.5 opacity-40">
                <Terminal className="w-5 h-5" />
                <p className="text-[10px]">No logs yet</p>
              </div>
            ) : (
              <div className="space-y-1 pb-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-1.5 border-b border-white/5 pb-1 last:border-0">
                    <span className="text-gray-600 shrink-0 select-none text-[10px]">[{log.timestamp}]</span>
                    <span className="shrink-0 pt-0.5">{getIcon(log.type)}</span>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className={cn(
                        "break-all text-[11px]",
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'warn' ? 'text-yellow-400' :
                        log.type === 'success' ? 'text-green-400' :
                        'text-gray-300'
                      )}>
                        {log.message}
                      </div>
                      {log.data && (
                        <pre className="p-1.5 bg-white/5 rounded border border-white/5 overflow-x-auto text-[10px] text-gray-400">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Collapsed — small square pill */
        <button
          onClick={toggleOpen}
          title="Open Console (Ctrl+Shift+K)"
          className="w-9 h-9 flex items-center justify-center bg-black/80 border border-white/10 rounded-lg shadow-lg hover:bg-white/10 hover:border-white/20 transition-all relative"
        >
          <Terminal className="w-4 h-4 text-gray-400" />
          {logs.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold px-1 py-0.5 rounded-full min-w-[16px] text-center leading-none animate-pulse">
              {logs.length > 99 ? '99+' : logs.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
};
