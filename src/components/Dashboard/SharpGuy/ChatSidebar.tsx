import React, { useState } from "react";
import { Plus, MessageSquare, Trash2, Edit2, Check, X, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import useChatStore from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ChatSidebar() {
  const { sessions, currentSessionId, loadSession, deleteSession, renameSession, newChat } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  return (
    <div className="flex flex-col h-full bg-white/[0.02] backdrop-blur-3xl border-r border-white/10 w-64 shrink-0 transition-all duration-300">
      <div className="p-5 border-b border-white/10">
        <Button
          onClick={() => newChat("create")}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-6 font-bold uppercase tracking-wider text-[10px] transition-all active:scale-95 border-none"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/10 px-4 text-center">
            <MessageSquare size={32} className="mb-2 opacity-5" />
            <p className="text-[10px] font-medium uppercase tracking-widest">No history</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-4 rounded-2xl cursor-pointer transition-all duration-200 border",
                currentSessionId === session.id
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-white/40 hover:bg-white/5 hover:text-white border-transparent"
              )}
              onClick={() => loadSession(session.id)}
            >
              <MessageSquare size={14} className={cn("shrink-0", currentSessionId === session.id ? "text-primary" : "opacity-30")} />
              
              <div className="flex-1 min-w-0">
                {editingId === session.id ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      className="w-full bg-black/40 border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(session.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <button onClick={() => handleRename(session.id)} className="text-primary hover:scale-110 transition-transform">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-[12px] font-semibold truncate pr-6 leading-tight">
                      {session.title || "Untitled Chat"}
                    </p>
                    <p className="text-[9px] opacity-40 uppercase tracking-tighter mt-1">
                      {formatDistanceToNow(new Date(session.updated_at))} ago
                    </p>
                  </>
                )}
              </div>

              {editingId !== session.id && (
                <div 
                  className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white">
                        <MoreVertical size={14} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1f26] border-white/10 text-white min-w-[140px] rounded-xl shadow-2xl">
                      <DropdownMenuItem 
                        onClick={() => startRename(session.id, session.title)}
                        className="flex items-center gap-2 focus:bg-white/10 cursor-pointer text-xs py-2 px-3"
                      >
                        <Edit2 size={13} />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteSession(session.id)}
                        className="flex items-center gap-2 focus:bg-red-500/20 text-red-400 cursor-pointer text-xs py-2 px-3"
                      >
                        <Trash2 size={13} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
