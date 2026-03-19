import React, { useState, useEffect, useRef } from 'react';
import { useAdminConsoleStore } from '@/store/useAdminConsoleStore';
import { useAuthStore } from '@/store/authStore';
import { isAdmin, isAdminOrStaff } from '@/lib/constants/roles';
import { isAdminRoute } from '@/lib/utils/security/helpers';
import {
  ChevronUp,
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

  // Show logic:
  // - Admin users: Can see console EVERYWHERE (admin pages + user pages)
  // - Staff users: Can only see console on ADMIN pages (not on user pages)
  if (!user) return null;

  const isAdminUser = isAdmin(user.role);
  const isStaffUser = isAdminOrStaff(user.role);
  const onAdminPage = isAdminRoute();

  // Admin can see everywhere, Staff can only see on admin pages
  if (isAdminUser || (isStaffUser && onAdminPage)) {
    // Show console
  } else {
    return null;
  }

  // Keyboard shortcut: Ctrl+Shift+K or Cmd+Shift+K to toggle
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
        "fixed bottom-0 right-0 left-0 bg-black/95 text-gray-300 transition-all duration-300 ease-in-out border-t border-white/10 shadow-2xl z-9999 font-mono text-xs overflow-hidden",
        isOpen ? (isMaximized ? "h-[80vh]" : "h-64") : "h-8"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 h-8 cursor-pointer hover:bg-white/10 transition-colors bg-black/95 backdrop-blur-sm",
          isOpen ? "border-b border-white/5" : "border-t border-white/10"
        )}
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-2">
          <Terminal className={cn("w-4 h-4", isOpen ? "text-blue-400" : "text-gray-400")} />
          <span className="font-semibold uppercase tracking-wider text-[10px]">SharpConsole v1.0</span>
          {logs.length > 0 && !isOpen && (
            <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-[9px] min-w-[20px] text-center animate-pulse">
              {logs.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {isOpen && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Minimize" : "Maximize"}
              >
                {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                onClick={clearLogs}
                title="Clear Logs"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
            onClick={toggleOpen}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div 
          ref={scrollRef}
          className="p-3 h-[calc(100%-32px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2 opacity-50">
              <Terminal className="w-8 h-8" />
              <p>No activity logged yet.</p>
            </div>
          ) : (
            <div className="space-y-1.5 pb-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 group border-b border-white/5 pb-1 last:border-0">
                  <span className="text-gray-600 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className="shrink-0 pt-0.5">{getIcon(log.type)}</span>
                  <div className="flex-1 space-y-1">
                    <div className={cn(
                      "break-all",
                      log.type === 'error' ? 'text-red-400' : 
                      log.type === 'warn' ? 'text-yellow-400' : 
                      log.type === 'success' ? 'text-green-400' : 
                      'text-gray-300'
                    )}>
                      {log.message}
                    </div>
                    {log.data && (
                      <pre className="mt-1 p-2 bg-white/5 rounded border border-white/5 overflow-x-auto text-[11px] text-gray-400">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
