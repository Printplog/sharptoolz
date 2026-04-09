import { useEffect, useRef, useState } from "react";
import { MessageSquare, FilePlus } from "lucide-react";
import useChatStore, { type ClarificationOption, type LoadedTemplate } from "@/store/chatStore";
import { cn } from "@/lib/utils";

import SharpGuyMessages from "./SharpGuyMessages";
import SharpGuyInput from "./SharpGuyInput";
import LivePreviewPanel from "./LivePreviewPanel";

export default function SharpGuyChat() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const statusText = useChatStore((s) => s.statusText);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadTemplateDirectly = useChatStore((s) => s.loadTemplateDirectly);
  const activeInlineTemplateId = useChatStore((s) => s.activeInlineTemplateId);
  const inlineEditorFields = useChatStore((s) => s.inlineEditorFields);
  const chatMode = useChatStore((s) => s.chatMode);
  const setChatMode = useChatStore((s) => s.setChatMode);

  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll last message into view above preview/input — keyboard-avoidance pattern
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
      templateId: activeInlineTemplateId ?? undefined,
      currentValues: inlineEditorFields,
      imageBase64: base64Image,
      onFieldUpdate: () => {},
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
      templateId: activeInlineTemplateId ?? undefined,
      currentValues: inlineEditorFields,
      onFieldUpdate: () => {},
    });
  };

  return (
    <div
      className="flex h-[calc(100vh-140px)] max-w-6xl mx-auto rounded-2xl border border-white/10 overflow-hidden bg-background transition-all duration-500"
    >
      {/* ── Chat column ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col min-w-0 transition-all duration-500",
          chatMode === "create" ? "flex-1" : "w-full"
        )}
      >
        {/* Mode Toggle Header */}
        <div className="flex items-center justify-center p-2 border-b border-white/5 bg-white/2">
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => setChatMode("chat")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                chatMode === "chat"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              <MessageSquare size={14} />
              Chat
            </button>
            <button
              onClick={() => setChatMode("create")}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                chatMode === "create"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              <FilePlus size={14} />
              Create Doc
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
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

      {/* ── Live preview column — desktop only ───────────────────────────────── */}
      {chatMode === "create" && (
        <div className="w-[380px] shrink-0 hidden lg:flex flex-col border-l border-white/8 min-h-0 animate-in slide-in-from-right duration-500">
          <LivePreviewPanel />
        </div>
      )}
    </div>
  );
}
