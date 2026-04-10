import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, Paperclip, X, Image as ImageIcon, Mic, MicOff, Sparkles, HelpCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SharpGuyInputProps {
  input: string;
  setInput: (val: string) => void;
  isStreaming: boolean;
  onSend: () => void;
  attachedImage: File | null;
  setAttachedImage: (file: File | null) => void;
}

export default function SharpGuyInput({
  input,
  setInput,
  isStreaming,
  onSend,
  attachedImage,
  setAttachedImage,
}: SharpGuyInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Type-to-focus pattern: Global listener that focuses the input when printable keys are pressed
  useEffect(() => {
    const handleWindowKeyDown = (e: KeyboardEvent) => {
      const isSearchActive = document.activeElement?.tagName === "INPUT" || 
                             document.activeElement?.tagName === "TEXTAREA" ||
                             (document.activeElement as HTMLElement)?.isContentEditable;
      
      if (isSearchActive) return;

      // Check if it's a printable character (single char, not a modifier)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        textareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
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
        if (event.error !== "no-speech") {
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

  return (
    <div className="p-4 md:p-6 flex flex-col gap-3 md:gap-4 bg-white/[0.02] backdrop-blur-xl border-t border-white/10">
      {/* Smart Chips */}
      {!input && !attachedImage && (
        <div className="flex gap-2 mb-1 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2 md:mx-0 md:px-0">
          <button
            onClick={() => setInput("How do I create a new document?")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card border-primary/20 text-[10px] text-primary font-bold uppercase tracking-wider transition-all whitespace-nowrap group shrink-0"
          >
            <HelpCircle size={11} className="group-hover:animate-pulse" />
            How to create?
          </button>
          <button
            onClick={() => setInput("Build me a USA Passport")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-[10px] text-white/40 font-bold uppercase tracking-wider whitespace-nowrap shrink-0 hover:text-white"
          >
            <FileText size={11} />
            USA Passport
          </button>
          <button
            onClick={() => setInput("Help me create an Alabama DL")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-[10px] text-white/40 font-bold uppercase tracking-wider whitespace-nowrap shrink-0 hover:text-white"
          >
            <FileText size={11} />
            Alabama DL
          </button>
          <button
            onClick={() => setInput("I need a Flight Itinerary")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-[10px] text-white/40 font-bold uppercase tracking-wider whitespace-nowrap shrink-0 hover:text-white"
          >
            <Sparkles size={11} />
            Flight Itinerary
          </button>
        </div>
      )}

      {/* Attachment Preview */}
      {attachedImage && (
        <div className="flex items-center gap-2 glass-card p-2 rounded-xl w-max animate-in fade-in slide-in-from-bottom-1">
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

      {/* Integrated Action Bar (Stacked Layout) */}
      <div className="flex-1 relative glass-panel rounded-2xl bg-white/[0.03] border-white/20 group-focus-within:border-primary/30 transition-all flex flex-col p-2 gap-2 shadow-2xl">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        
        {/* Dynamic Textarea (Top) */}
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? "Listening..." : "Ask Sharp Guy..."}
          rows={1}
          className="flex-1 resize-none min-h-[44px] max-h-[200px] text-[15px] py-2 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl px-2 transition-all outline-none shadow-none text-white placeholder:text-white/20"
          disabled={isStreaming}
        />

        {/* Action Row (Bottom) */}
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-white/5">
          <div className="flex gap-1 items-center">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
            >
              <Paperclip size={18} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-9 w-9 rounded-full transition-all",
                isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "text-white/30 hover:text-white hover:bg-white/10"
              )}
              onClick={toggleListening}
              disabled={isStreaming}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
          </div>

          <Button
            size="icon"
            className={cn(
              "h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full active:scale-90 transition-all",
              (!input.trim() && !attachedImage) || isStreaming ? "opacity-30 grayscale saturate-0" : "opacity-100"
            )}
            onClick={handleSend}
            disabled={(!input.trim() && !attachedImage) || isStreaming}
          >
            <ArrowUp size={20} className="stroke-[3]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
