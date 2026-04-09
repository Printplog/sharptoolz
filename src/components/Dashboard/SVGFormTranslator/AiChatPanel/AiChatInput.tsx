import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Paperclip, X, Image as ImageIcon, Mic, MicOff, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AiChatInputProps {
  input: string;
  setInput: (val: string) => void;
  isStreaming: boolean;
  onSend: () => void;
  attachedImage: File | null;
  setAttachedImage: (file: File | null) => void;
}

export default function AiChatInput({
  input,
  setInput,
  isStreaming,
  onSend,
  attachedImage,
  setAttachedImage,
}: AiChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true; // Use interim results for more responsive feedback
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join("");
        
        if (event.results[0].isFinal) {
          const newValue = input ? input + " " + transcript : transcript;
          setInput(newValue);
          setIsListening(false);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
            toast.error(`Voice error: ${event.error}`);
        }
      };

      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    }
  }, [setInput]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      try {
        recognition.start();
      } catch (e) {
        console.error("Recognition start failed", e);
        setIsListening(false);
      }
    }
  };

  const handleSend = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    }
    onSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setAttachedImage(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleMagicFill = () => {
    const prompt = "Please help me fill out this entire document automatically with realistic dummy data for a professional use case.";
    setInput(prompt);
  };

  return (
    <div className="border-t border-white/10 p-4 flex flex-col gap-3 bg-black/20">
      {/* Smart Chips */}
      {!input && !attachedImage && (
        <div className="flex gap-2 mb-1 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={handleMagicFill}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400 font-bold uppercase tracking-wider hover:bg-blue-500/20 transition-all whitespace-nowrap group"
          >
            <Sparkles size={10} className="group-hover:animate-pulse" />
            Magic Fill
          </button>
          <button
            onClick={() => setInput("Search for recent company addresses in New York")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-bold uppercase tracking-wider hover:bg-white/10 transition-all whitespace-nowrap"
          >
            Web Search
          </button>
        </div>
      )}

      {/* Attachment Preview */}
      {attachedImage && (
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-2 rounded-xl w-max animate-in fade-in slide-in-from-bottom-1">
          <ImageIcon size={14} className="text-muted-foreground" />
          <span className="text-xs text-white max-w-[150px] truncate">
            {attachedImage.name}
          </span>
          <button
            onClick={() => setAttachedImage(null)}
            className="text-muted-foreground hover:text-white ml-2 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="flex gap-2 items-end">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <div className="flex gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
          >
            <Paperclip size={18} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={`h-10 w-10 rounded-full transition-all focus-visible:ring-0 focus-visible:ring-offset-0 ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            onClick={toggleListening}
            disabled={isStreaming}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Ask AI or attach an image..."}
          rows={1}
          className="resize-none min-h-[40px] max-h-[150px] text-sm py-2.5 bg-white/5 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl px-4 transition-all outline-none shadow-none"
          disabled={isStreaming}
        />
        <Button
          size="icon"
          className="h-10 w-10 shrink-0 bg-blue-600 text-white hover:bg-blue-500 rounded-full shadow-lg shadow-blue-600/20 active:scale-95 transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={handleSend}
          disabled={(!input.trim() && !attachedImage) || isStreaming}
        >
          <ArrowUp size={18} />
        </Button>
      </div>
    </div>
  );
}
