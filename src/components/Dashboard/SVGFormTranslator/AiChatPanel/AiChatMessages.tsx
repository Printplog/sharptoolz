import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Copy, Check, Eye, FileText } from "lucide-react";
import SharpGuyIcon from "@/components/SharpGuyIcon";
import { cn } from "@/lib/utils";
import type { ChatMessage, ClarificationOption } from "@/store/chatStore";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ToolCardGrid from "../../SharpGuy/ToolCardGrid";
import ClarificationPrompt from "../../SharpGuy/ClarificationPrompt";
import DocumentReady from "../../SharpGuy/DocumentReady";

interface AiChatMessagesProps {
  messages: ChatMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  statusText?: string | null;
  onOptionSelect?: (option: ClarificationOption) => void;
  onSwitchPreview?: () => void;
}

const CHARS_PER_TICK = 3;
const TICK_MS = 20;

const MemoizedMessageItem = memo(
  ({
    msg,
    statusText,
    onOptionSelect,
    onSwitchPreview,
  }: {
    msg: ChatMessage;
    statusText?: string | null;
    onOptionSelect?: (option: ClarificationOption) => void;
    onSwitchPreview?: () => void;
  }) => {
    const [displayed, setDisplayed] = useState(
      msg.isStreaming ? "" : msg.content,
    );
    const [copied, setCopied] = useState(false);
    const queueRef = useRef("");
    const navigate = useNavigate();

    useEffect(() => {
      if (!msg.isStreaming) {
        setDisplayed(msg.content);
        queueRef.current = "";
        return;
      }
      const alreadyQueued = displayed.length + queueRef.current.length;
      const newChars = msg.content.slice(alreadyQueued);
      if (newChars) queueRef.current += newChars;
    }, [msg.content, msg.isStreaming, displayed.length]);

    useEffect(() => {
      if (!msg.isStreaming) return;
      const id = setInterval(() => {
        if (!queueRef.current) return;
        const chunk = queueRef.current.slice(0, CHARS_PER_TICK);
        queueRef.current = queueRef.current.slice(CHARS_PER_TICK);
        setDisplayed((prev) => prev + chunk);
      }, TICK_MS);
      return () => clearInterval(id);
    }, [msg.isStreaming]);

    const handleCopy = useCallback(() => {
      navigator.clipboard.writeText(msg.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }, [msg.content]);

    const handleLinkClick = useCallback(
      (e: React.MouseEvent, href: string) => {
        if (href.startsWith("/")) {
          e.preventDefault();
          navigate(href);
        }
      },
      [navigate],
    );

    const renderContent = displayed;
    const shouldHideBubble =
      msg.role === "assistant" &&
      msg.isStreaming &&
      !renderContent &&
      statusText;

    return (
      <div
        className={cn(
          "flex flex-col gap-1 scroll-mt-20 group/msg",
          msg.role === "user" ? "items-end" : "items-start",
        )}
      >
        {msg.role === "assistant" && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-0.5">
            <SharpGuyIcon size={28} />
            <span>Sharp Guy</span>
          </div>
        )}

        {!shouldHideBubble && (
          <>
            <div className="relative max-w-[85%]">
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-[15px] leading-relaxed transition-all",
                  msg.role === "user"
                    ? "bg-primary/20 backdrop-blur-md border border-primary/30 text-white rounded-tr-none whitespace-pre-wrap font-medium"
                    : "glass-card rounded-tl-none text-white/90 [&_ul]:list-disc [&_ul]:list-inside [&_li]:mt-1 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:list-inside [&_a]:text-indigo-400 [&_a]:underline [&_strong]:text-indigo-400 [&_strong]:font-bold",
                )}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href || "#"}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium border-b border-indigo-400/30"
                          onClick={(e) => handleLinkClick(e, href || "")}
                          target={href?.startsWith("/") ? undefined : "_blank"}
                          rel={
                            href?.startsWith("/")
                              ? undefined
                              : "noopener noreferrer"
                          }
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {renderContent}
                  </ReactMarkdown>
                ) : (
                  renderContent
                )}
                {msg.isStreaming && (
                  <span className="inline-block w-[2.5px] h-[1.1em] bg-primary ml-1.5 align-middle animate-[blink_1s_step-end_infinite] primary-glow" />
                )}

                {msg.role === "user" && msg.attachmentUrl && (
                  <div className="mt-2 text-xs italic opacity-70 flex items-center gap-1">
                    <span className="line-clamp-1 truncate">
                      📎 [Image Attached]
                    </span>
                  </div>
                )}
              </div>

              {/* Copy button */}
              {!msg.isStreaming && msg.content && (
                <button
                  onClick={handleCopy}
                  className="absolute -bottom-3 right-1 transition-transform hover:scale-125 bg-background border border-white/10 rounded-md p-1 shadow-md z-10"
                  title="Copy message"
                >
                  {copied ? (
                    <Check size={12} className="text-green-400" />
                  ) : (
                    <Copy size={12} className="text-muted-foreground" />
                  )}
                </button>
              )}
            </div>

            {/* Tool cards */}
            {msg.toolCards && msg.toolCards.length > 0 && (
              <ToolCardGrid cards={msg.toolCards} />
            )}

            {/* Clarification prompt */}
            {msg.clarification && onOptionSelect && (
              <ClarificationPrompt
                question={msg.clarification.question}
                options={msg.clarification.options}
                onSelect={onOptionSelect}
                onCustom={(value) => onOptionSelect({ label: value, value })}
              />
            )}

            {/* Template loaded card */}
            {msg.loadedTemplate && (
              <div className="w-full mt-2 animate-in fade-in duration-300">
                <button 
                  onClick={() => navigate(`/tools/${msg.loadedTemplate?.id}`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all text-[11px] text-indigo-300 font-bold uppercase tracking-wider shadow-sm"
                >
                  <FileText size={12} className="shrink-0" />
                  <span>
                    {msg.loadedTemplate.name} Loaded — Open Full Editor →
                  </span>
                </button>
              </div>
            )}

            {/* Document ready for download */}
            {msg.documentFile && <DocumentReady file={msg.documentFile} />}

            {/* Purchased confirmation */}
            {msg.purchasedTemplate && (
              <div className="w-full mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] px-3.5 py-2.5 flex items-center gap-2">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <p className="text-[12px] text-emerald-200">
                    Purchased <strong>{msg.purchasedTemplate.name}</strong> for
                    ${msg.purchasedTemplate.price}. Balance: $
                    {msg.purchasedTemplate.new_balance}
                  </p>
                </div>
              </div>
            )}

            {/* View Preview Button — added when changes are made */}
            {msg.fieldUpdates && msg.fieldUpdates.length > 0 && onSwitchPreview && (
              <button
                onClick={onSwitchPreview}
                className="mt-2 inline-flex items-center gap-2 py-2 px-4 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-[11px] text-indigo-300 font-bold uppercase tracking-widest transition-all"
              >
                <Eye size={13} className="shrink-0" />
                <span>View Preview</span>
              </button>
            )}
          </>
        )}

        {/* Field update badges (smaller) */}
        {msg.fieldUpdates && msg.fieldUpdates.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 max-w-[88%]">
            {msg.fieldUpdates.map((fid) => (
              <span
                key={fid}
                className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10"
              >
                ✓ {fid}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  },
);
MemoizedMessageItem.displayName = "MemoizedMessageItem";

export default function AiChatMessages({
  messages,
  bottomRef,
  statusText,
  onOptionSelect,
  onSwitchPreview,
}: AiChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-10 text-center gap-4 text-muted-foreground">
        <div className="flex items-center justify-center transition-transform hover:scale-110 duration-300">
          <SharpGuyIcon size={96} />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Sharp Guy</p>
          <p className="text-xs mt-1 max-w-[200px]">
            Describe what you want, attach a CV to auto-fill, or ask Sharp Guy
            to clean up your photos!
          </p>
        </div>
      </div>
    );
  }

  const lastIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <>
      {messages.map((msg, i) => (
        <MemoizedMessageItem
          key={i}
          msg={msg}
          statusText={statusText}
          onOptionSelect={onOptionSelect}
          onSwitchPreview={onSwitchPreview}
        />
      ))}
      {statusText && (
        <div
          className={cn(
            "flex items-start gap-2 px-1",
            lastIsAssistant ? "mt-[-12px] ml-[36px]" : "",
          )}
        >
          {!lastIsAssistant && <SharpGuyIcon size={28} className="shrink-0" />}
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2 min-w-[160px]">
            <span className="flex gap-[4px] items-end h-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-[11px] text-primary font-bold uppercase tracking-wider">
              {statusText}
            </span>
            <Loader2
              size={12}
              className="animate-spin text-primary shrink-0 ml-auto opacity-60"
            />
          </div>
        </div>
      )}
      <div ref={bottomRef} className="h-2" />
    </>
  );
}
