import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Copy, Check, FileText } from "lucide-react";
import SharpGuyIcon from "@/components/SharpGuyIcon";
import { cn } from "@/lib/utils";
import type { ChatMessage, ClarificationOption } from "@/store/chatStore";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClarificationPrompt from "./ClarificationPrompt";
import DocumentReady from "./DocumentReady";

const CHARS_PER_TICK = 3;
const TICK_MS = 20;

const MessageItem = memo(
  ({
    msg,
    statusText,
    onOptionSelect,
  }: {
    msg: ChatMessage;
    statusText?: string | null;
    onOptionSelect?: (option: ClarificationOption) => void;
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
    }, [msg.content, msg.isStreaming]);

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

    const handleLinkClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (href.startsWith("/")) {
          e.preventDefault();
          navigate(href);
        }
      },
      [navigate],
    );

    const handleCopy = useCallback(() => {
      navigator.clipboard.writeText(msg.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }, [msg.content]);

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
            <div className="relative max-w-[88%]">
              <div
                className={cn(
                  "rounded-xl px-3 py-2 text-sm leading-relaxed wrap-break-word",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm whitespace-pre-wrap"
                    : "bg-white/5 border border-white/10 text-white rounded-bl-sm [&_ul]:list-disc [&_ul]:list-inside [&_li]:mt-1 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:list-inside [&_a]:text-blue-400 [&_a]:underline",
                )}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => (
                        <a
                          href={href || "#"}
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
                  <span className="inline-block w-[6px] h-[13px] bg-white rounded-sm ml-1 align-middle animate-pulse" />
                )}

                {msg.role === "user" && msg.attachmentUrl && (
                  <div className="mt-2 text-xs italic opacity-70 flex items-center gap-1">
                    <span className="line-clamp-1 truncate">
                      📎 [Image Attached]
                    </span>
                  </div>
                )}
              </div>

              {/* Copy button — visible on hover */}
              {!msg.isStreaming && msg.content && (
                <button
                  onClick={handleCopy}
                  className="absolute -bottom-3 right-1 transition-transform hover:scale-125 bg-background border border-white/10 rounded-md p-1"
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

            {/* Clarification prompt */}
            {msg.clarification && onOptionSelect && (
              <ClarificationPrompt
                question={msg.clarification.question}
                options={msg.clarification.options}
                onSelect={onOptionSelect}
                onCustom={(value) => onOptionSelect({ label: value, value })}
              />
            )}

            {/* Template loaded — slim badge (preview is in the right panel) */}
            {msg.loadedTemplate && (
              <div className="w-full mt-2 animate-in fade-in duration-300">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/6 text-[11px] text-emerald-300">
                  <FileText size={11} className="shrink-0" />
                  <span>
                    <strong>{msg.loadedTemplate.name}</strong> loaded — see preview →
                  </span>
                </div>
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
          </>
        )}
      </div>
    );
  },
);
MessageItem.displayName = "MessageItem";

interface SharpGuyMessagesProps {
  messages: ChatMessage[];
  bottomRef: React.RefObject<HTMLDivElement | null>;
  statusText?: string | null;
  onOptionSelect?: (option: ClarificationOption) => void;
}

export default function SharpGuyMessages({
  messages,
  bottomRef,
  statusText,
  onOptionSelect,
}: SharpGuyMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-5 text-muted-foreground">
        <div className="flex items-center justify-center transition-transform hover:scale-110 duration-300">
          <SharpGuyIcon size={120} />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">
            Hey, I'm Sharp Guy
          </p>
          <p className="text-sm mt-2 max-w-[320px] text-white/50 leading-relaxed">
            Your AI assistant for all things SharpToolz. Ask me about our tools,
            pricing, or let me help you create your next document.
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
        <MessageItem
          key={i}
          msg={msg}
          statusText={statusText}
          onOptionSelect={onOptionSelect}
        />
      ))}
      {statusText && (
        <div
          className={cn(
            "flex items-start gap-2 px-1",
            lastIsAssistant ? "mt-[-8px] ml-[36px]" : "",
          )}
        >
          {!lastIsAssistant && <SharpGuyIcon size={28} className="shrink-0" />}
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5 min-w-[140px]">
            <span className="flex gap-[3px] items-end h-3">
              <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-1 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-[11px] text-indigo-300 font-medium whitespace-nowrap">
              {statusText}
            </span>
            <Loader2
              size={10}
              className="animate-spin text-indigo-400 shrink-0 ml-auto"
            />
          </div>
        </div>
      )}
      <div ref={bottomRef} className="h-2" />
    </>
  );
}
