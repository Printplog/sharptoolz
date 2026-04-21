import { useState, useMemo, useEffect, useRef } from "react";
import { svgEditorDocs } from "@/docs/svgEditorDocs";
import { Input } from "@/components/ui/input";
import { Search, Copy, ChevronRight, Hash, BookOpen, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { DocSection } from "@/types";
import { motion } from "framer-motion";

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
      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <div className="dashboard-content flex flex-col gap-6 py-8 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24 self-start space-y-10 z-[40]">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="w-8 h-8 rounded-xl bg-[#cee88c]/10 flex items-center justify-center border border-[#cee88c]/20 shadow-[0_0_15px_rgba(206,232,140,0.1)]">
                <BookOpen className="h-4 w-4 text-[#cee88c]" />
              </div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">Documentation</h1>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-[#cee88c] transition-colors" />
              <Input
                placeholder="Search extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 bg-white/[0.03] border-white/10 rounded-full text-white placeholder:text-white/10 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/5 backdrop-blur-xl transition-all outline-0"
              />
            </div>
          </div>

          <nav 
            ref={sidebarNavRef}
            className="relative flex flex-col gap-1.5 max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-4 -mr-4"
          >
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] px-4 mb-3">Extensions Index</h3>
            {filteredDocs.map((section) => (
              <button
                key={section.id}
                ref={(el) => { itemRefs.current[section.id] = el; }}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "group relative flex items-center justify-between px-5 py-4 rounded-full text-[11px] font-black transition-all duration-500 text-left uppercase tracking-wider",
                  activeSection === section.id
                    ? "text-[#cee88c]"
                    : "text-white/30 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                {activeSection === section.id && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-[#cee88c]/5 rounded-full -z-0 border border-[#cee88c]/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}

                <span className="relative z-10 flex items-center gap-3">
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                    activeSection === section.id ? "bg-[#cee88c] scale-125" : "bg-white/10 group-hover:bg-[#cee88c]/40"
                  )} />
                  {section.title}
                </span>
                <ChevronRight className={cn(
                  "relative z-10 h-3.5 w-3.5 transition-all duration-500",
                  activeSection === section.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                )} />
              </button>
            ))}
          </nav>
          
          <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-2xl space-y-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#cee88c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex items-center gap-2 text-[#cee88c]">
              <Info className="h-4 w-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Usage Tip</p>
            </div>
            <p className="relative z-10 text-[10px] text-white/40 font-bold leading-relaxed uppercase tracking-tight">
              Paste these IDs into your SVG editor to enable advanced interactive form features instantly.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-32">
          {filteredDocs.length > 0 ? (
            filteredDocs.map((section) => (
              <DocSectionCard key={section.id} section={section} handleCopy={handleCopy} />
            ))
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01] backdrop-blur-sm">
              <Search className="h-12 w-12 text-white/5 mx-auto mb-6" />
              <p className="text-white/20 font-bold uppercase tracking-widest text-xs">No documentation matches "{searchQuery}"</p>
              <button onClick={() => setSearchQuery("")} className="mt-6 text-[10px] font-black text-[#cee88c] uppercase border-b border-[#cee88c]/20 hover:border-[#cee88c] transition-all">
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
    <section id={section.id} className="scroll-mt-32 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col gap-4 group">
        <div className="flex items-center gap-4">
          <div className="h-10 w-1.5 bg-[#cee88c] rounded-full shadow-[0_0_15px_rgba(206,232,140,0.3)]" />
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            {section.title}
            <Hash className="h-6 w-6 text-white/5 group-hover:text-[#cee88c]/20 transition-colors" />
          </h2>
        </div>
        <p className="text-white/40 leading-relaxed text-sm font-medium max-w-2xl pl-5 border-l border-white/5 ml-0.5">
          {section.content}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {section.codeExamples?.map((example, idx) => (
          <div key={idx} className="group/card relative flex flex-col gap-5 p-6 rounded-[32px] bg-white/[0.01] border border-white/5 hover:border-[#cee88c]/20 transition-all duration-500 overflow-hidden">
            {/* Subtle background glow on hover */}
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#cee88c]/[0.02] rounded-full blur-[60px] group-hover/card:bg-[#cee88c]/[0.05] transition-all duration-700" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#cee88c] uppercase tracking-[0.25em]">{example.title}</span>
                {example.description && <p className="text-[10px] text-white/20 font-bold uppercase tracking-tight">{example.description}</p>}
              </div>
              <button 
                onClick={() => handleCopy(example.code)}
                className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:bg-[#cee88c] hover:text-black hover:border-[#cee88c] hover:rotate-12 transition-all duration-500 group/btn"
              >
                <Copy className="h-4 w-4 transition-transform group-active/btn:scale-90" />
              </button>
            </div>

            <div className="relative z-10 font-mono text-[13px] text-white/90 bg-[#0A0D11]/60 p-5 rounded-2xl border border-white/5 backdrop-blur-sm group-hover/card:border-white/10 transition-all">
              <div className="flex items-center gap-1.5 mb-3 opacity-30">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
              </div>
              <code className="block break-all leading-relaxed">
                {example.code}
              </code>
            </div>
          </div>
        ))}
      </div>

      {section.visualPreview && (
        <div className="mx-auto w-fit px-6 py-3 rounded-full bg-[#cee88c]/5 border border-[#cee88c]/10 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-[#cee88c] animate-pulse" />
          <p className="text-[10px] text-[#cee88c] font-black uppercase tracking-[0.2em]">
            Real-world Implementation: <span className="text-white ml-2">{section.visualPreview.site}</span>
          </p>
        </div>
      )}

      {section.subsections && section.subsections.length > 0 && (
        <div className="space-y-10 pl-6 lg:pl-10">
          {section.subsections.map((sub) => (
            <div key={sub.id} id={sub.id} className="space-y-6 relative group/sub">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover/sub:bg-[#cee88c] group-hover/sub:scale-150 transition-all duration-500" />
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">
                  {sub.title}
                </h3>
              </div>
              
              <div className="pl-6 border-l border-white/5 space-y-4">
                <p className="text-sm text-white/30 font-medium leading-relaxed max-w-2xl">{sub.content}</p>
                
                {sub.codeExamples && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sub.codeExamples.map((ex, i) => (
                      <div key={i} className="flex items-center justify-between gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-[#cee88c]/10 transition-all group/ex">
                        <code className="text-[12px] font-mono text-[#cee88c]/70 group-hover/ex:text-[#cee88c] transition-colors break-all">{ex.code}</code>
                        <button 
                          onClick={() => handleCopy(ex.code)} 
                          className="shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
