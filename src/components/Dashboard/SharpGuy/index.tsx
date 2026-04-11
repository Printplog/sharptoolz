import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageSquare, FilePlus, Menu, X as CloseIcon, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import useChatStore, { type ClarificationOption, type LoadedTemplate } from "@/store/chatStore";
import { cn } from "@/lib/utils";

import SharpGuyMessages from "./SharpGuyMessages";
import SharpGuyInput from "./SharpGuyInput";
import ChatSidebar from "./ChatSidebar";

export default function SharpGuyChat() {
  const { 
    messages, 
    isStreaming, 
    statusText, 
    sendMessage, 
    loadTemplateDirectly, 
    loadSession, 
    fetchSessions,
    currentSessionId 
  } = useChatStore();
  
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, currentSessionId, loadSession]);

  // Scroll last message into view — keyboard-avoidance pattern
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachedImage) || isStreaming) return;

    let base64Image: string | undefined = undefined;
    if (attachedImage) {
      try {
        base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(attachedImage);
        });
      } catch (err) {
        console.error("Failed to read attached image", err);
      }
    }

    setInput("");
    setAttachedImage(null);

    sendMessage(trimmed, {
      templateId: undefined,
      currentValues: {},
      imageBase64: base64Image,
      onFieldUpdate: () => {}, // No field updates in global chat
    });
  };

  const handleOptionSelect = (option: ClarificationOption) => {
    if (option.template_id) {
      const tpl: LoadedTemplate = {
        id: option.template_id,
        name: option.label,
        toolName: "",
        price: "0",
        banner: "",
        field_count: 0,
      };
      loadTemplateDirectly(tpl);
      return;
    }
    sendMessage(option.value, {
      templateId: undefined,
      currentValues: {},
      onFieldUpdate: () => {},
    });
  };

  return (
    <div className="flex h-[calc(100vh-140px)] max-w-6xl mx-auto rounded-3xl overflow-hidden glass-panel relative">
      
      {/* ── Chat Sidebar (Desktop) ───────────────────────────────────────────── */}
      <div 
        className={cn(
          "hidden md:block border-r border-white/10 transition-all duration-300 ease-in-out h-full overflow-hidden",
          isSidebarVisible ? "w-64 opacity-100" : "w-0 opacity-0 border-none"
        )}
      >
        <div className="w-64 h-full">
          <ChatSidebar />
        </div>
      </div>

      {/* ── Chat Sidebar (Mobile Overlay) ────────────────────────────────────── */}
      <div 
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <div 
          className={cn(
            "absolute inset-y-0 left-0 w-64 bg-background border-r border-white/10 transition-transform duration-300 transform",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ChatSidebar />
        </div>
      </div>

      {/* ── Chat Main Column ─────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 relative h-full">
        {/* Desktop Collapse Toggle */}
        <div className="hidden md:block absolute top-1 left-1 z-10">
          <button
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="p-2 text-white/20 hover:text-primary transition-colors bg-black/20 backdrop-blur-md rounded-xl border border-white/5 hover:border-primary/20"
          >
            {isSidebarVisible ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
        
        {/* Mobile Header Toolbar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2.5 hover:bg-white/10 rounded-xl text-primary transition-colors"
          >
            <PanelLeftOpen size={20} />
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Sharp Guy AI</span>
          <div className="w-10" /> {/* Spacer */}
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar"
        >
          <SharpGuyMessages
            messages={messages}
            bottomRef={bottomRef}
            statusText={statusText}
            onOptionSelect={handleOptionSelect}
          />
        </div>

        <SharpGuyInput
          input={input}
          setInput={setInput}
          isStreaming={isStreaming}
          onSend={handleSend}
          attachedImage={attachedImage}
          setAttachedImage={setAttachedImage}
        />
      </div>
    </div>
  );
}
