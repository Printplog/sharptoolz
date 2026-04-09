import { useEffect, useRef, useState } from "react";
import useChatStore, { type ClarificationOption } from "@/store/chatStore";
import useToolStore from "@/store/formStore";

import AiChatMessages from "./AiChatMessages";
import AiChatInput from "./AiChatInput";
import AiPreviewPanel from "./AiPreviewPanel";

interface AiChatPanelProps {
  templateId?: string;
  purchasedTemplateId?: string;
}

export default function AiChatPanel({
  templateId,
  purchasedTemplateId,
}: AiChatPanelProps) {
  const { messages, isStreaming, statusText, sendMessage } = useChatStore();
  const { fields, updateField, notifyDependents } = useToolStore();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [fieldUpdateCount, setFieldUpdateCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll last message into view above the preview+input — keyboard-avoidance pattern
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming, fieldUpdateCount]);

  const getCurrentValues = (): Record<string, string> => {
    const vals: Record<string, string> = {};
    for (const f of fields) {
      if (f.id) vals[f.id] = (f.currentValue as string) ?? "";
    }
    return vals;
  };

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
      templateId,
      purchasedTemplateId,
      currentValues: getCurrentValues(),
      imageBase64: base64Image,
      onFieldUpdate: (id, value) => {
        updateField(id, value);
        notifyDependents(id, value);
        setFieldUpdateCount((c) => c + 1);
      },
      // No redirect — stay on this page; template loading is informational here
      onTemplateLoad: undefined,
    });
  };

  const handleOptionSelect = (option: ClarificationOption) => {
    // No redirect — option selection sends a message to load inline
    sendMessage(option.value, {
      templateId,
      purchasedTemplateId,
      currentValues: getCurrentValues(),
      onFieldUpdate: (id, value) => {
        updateField(id, value);
        notifyDependents(id, value);
        setFieldUpdateCount((c) => c + 1);
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <AiChatMessages
          messages={messages}
          bottomRef={bottomRef}
          statusText={statusText}
          onOptionSelect={handleOptionSelect}
        />
      </div>

      {/* Inline live preview — auto-expands after AI edits */}
      <AiPreviewPanel
        templateId={templateId}
        purchasedTemplateId={purchasedTemplateId}
        updateCount={fieldUpdateCount}
      />

      {/* Input */}
      <AiChatInput
        input={input}
        setInput={setInput}
        isStreaming={isStreaming}
        onSend={handleSend}
        attachedImage={attachedImage}
        setAttachedImage={setAttachedImage}
      />
    </div>
  );
}
