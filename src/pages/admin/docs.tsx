import { useState, useMemo, useEffect, useRef } from "react";
import { svgEditorDocs } from "@/docs/svgEditorDocs";
import { Input } from "@/components/ui/input";
import { Search, Copy, ChevronRight, Hash, BookOpen, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DocSection } from "@/types";

export default function AdminDocsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("intro");
  const observer = useRef<IntersectionObserver | null>(null);
  const sidebarNavRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const filteredDocs = useMemo(() => {
    if (!searchQuery) return svgEditorDocs;
    
    const query = searchQuery.toLowerCase();
    return svgEditorDocs.filter(section => 
      section.title.toLowerCase().includes(query) || 
      section.content.toLowerCase().includes(query) ||
      section.codeExamples?.some(ex => 
        ex.title.toLowerCase().includes(query) || 
        ex.code.toLowerCase().includes(query)
      ) ||
      section.subsections?.some(sub => 
        sub.title.toLowerCase().includes(query) || 
        sub.content.toLowerCase().includes(query)
      )
    );
  }, [searchQuery]);

  // Scroll Spy Logic
  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observer.current = new IntersectionObserver(handleIntersect, {
      rootMargin: "-20% 0px -70% 0px", // Trigger when section is in top-ish part of screen
      threshold: 0
    });

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.current?.observe(section));

    return () => observer.current?.disconnect();
  }, [filteredDocs]); // Re-observe if filter changes

  // Auto-scroll Sidebar when Active Section changes
  useEffect(() => {
    const activeBtn = itemRefs.current[activeSection];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest"
      });
    }
  }, [activeSection]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard!");
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-8 self-start space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold text-white tracking-tight uppercase italic">ID Documentation</h1>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary/40 focus:ring-primary/20 transition-all outline-0"
              />
            </div>
          </div>

          <nav 
            ref={sidebarNavRef}
            className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2"
          >
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] px-3 mb-2">Segments</h3>
            {filteredDocs.map((section) => (
              <button
                key={section.id}
                ref={(el) => { itemRefs.current[section.id] = el; }}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left uppercase tracking-tight",
                  activeSection === section.id
                    ? "bg-primary text-background"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "h-1 w-1 rounded-full transition-all",
                  activeSection === section.id ? "bg-background scale-150" : "bg-white/10"
                )} />
                {section.title}
              </button>
            ))}
          </nav>
          
          <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-white/20">
            <Info className="h-4 w-4" />
            <p className="text-[10px] font-medium uppercase tracking-tighter">Copy IDs into your SVG editor</p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-24">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((section) => (
              <DocSectionCard key={section.id} section={section} handleCopy={handleCopy} />
            ))
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
              <Search className="h-12 w-12 text-white/5 mx-auto mb-4" />
              <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No documentation matches "{searchQuery}"</p>
              <button onClick={() => setSearchQuery("")} className="mt-4 text-[10px] font-black text-primary uppercase border-b border-primary/20 hover:border-primary transition-all">
                Reset Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocSectionCard({ section, handleCopy }: { section: DocSection, handleCopy: (c: string) => void }) {
  return (
    <section id={section.id} className="scroll-mt-24 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 group">
        <div className="h-8 w-1 bg-primary rounded-full" />
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
          {section.title}
          <Hash className="h-5 w-5 text-white/5 group-hover:text-primary/20 transition-colors" />
        </h2>
      </div>

      <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl space-y-8">
        <p className="text-white/50 leading-relaxed text-sm font-medium">
          {section.content}
        </p>

        {section.codeExamples && section.codeExamples.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {section.codeExamples.map((example, idx) => (
              <div key={idx} className="flex flex-col gap-4 p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{example.title}</span>
                  <button 
                    onClick={() => handleCopy(example.code)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-primary hover:text-background transition-all"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="font-mono text-[13px] text-white/90 bg-black/20 p-4 rounded-xl border border-white/5 break-all">
                  {example.code}
                </div>
                {example.description && <p className="text-[10px] text-white/30 italic font-medium leading-normal">{example.description}</p>}
              </div>
            ))}
          </div>
        )}

        {section.visualPreview && (
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-[11px] text-primary/80 font-black uppercase tracking-widest">
              Live impact: <span className="text-white">{section.visualPreview.site}</span>
            </p>
          </div>
        )}
      </div>

      {section.subsections && section.subsections.length > 0 && (
        <div className="space-y-12 pl-12 relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-white/5" />
          {section.subsections.map((sub) => (
            <div key={sub.id} id={sub.id} className="space-y-4 relative group">
              <div className="absolute -left-[27px] top-1.5 h-1.5 w-1.5 rounded-full bg-white/10 group-hover:bg-primary transition-colors" />
              <h3 className="text-lg font-black text-white italic tracking-tight flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-primary" />
                {sub.title}
              </h3>
              <p className="text-sm text-white/40 font-medium">{sub.content}</p>
              
              {sub.codeExamples && (
                <div className="space-y-3">
                  {sub.codeExamples.map((ex, i) => (
                    <div key={i} className="flex items-center justify-between gap-6 p-3 pl-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
                      <code className="text-[12px] font-mono text-blue-400 break-all">{ex.code}</code>
                      <button onClick={() => handleCopy(ex.code)} className="shrink-0 p-1.5 rounded bg-white/5 hover:text-primary transition-all">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
