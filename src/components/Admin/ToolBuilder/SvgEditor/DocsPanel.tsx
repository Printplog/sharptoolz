import { useState, useEffect } from "react";
import { svgEditorDocs } from "@/docs/svgEditorDocs";
import type { DocSection } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useHeight } from "@/hooks/useHeight";

interface DocsPanelProps {
  activeSection?: string; // Optional ID to auto-scroll to a section
}

export default function DocsPanel({ activeSection }: DocsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["intro"]));
  const [searchQuery, setSearchQuery] = useState("");
  const { ref: navbarRef } = useHeight<HTMLDivElement>();

  // Auto-expand section when activeSection changes
  useEffect(() => {
    if (activeSection) {
      setExpandedSections(prev => {
        const newSet = new Set(prev);
        newSet.add(activeSection);
        return newSet;
      });
    }
  }, [activeSection]);

  // Listen for text selection in the document
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        // Only update search if selection is in an input or editor area
        const activeElement = document.activeElement;
        const isInInput = activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement?.classList.contains('element-editor');

        if (isInInput) {
          setSearchQuery(selection.toString().trim());

          // Auto-expand all sections when searching
          const allSectionIds = getAllSectionIds(svgEditorDocs);
          setExpandedSections(new Set(allSectionIds));
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Search filtering logic
  const filteredDocs = searchQuery
    ? filterDocsBySearch(svgEditorDocs, searchQuery.toLowerCase())
    : svgEditorDocs;

  function filterDocsBySearch(docs: DocSection[], query: string): DocSection[] {
    return docs
      .map(section => {
        // Check if this section matches
        const titleMatch = section.title.toLowerCase().includes(query);
        const contentMatch = section.content.toLowerCase().includes(query);
        const codeMatch = section.codeExamples?.some(ex =>
          ex.code.toLowerCase().includes(query) ||
          (ex.description && ex.description.toLowerCase().includes(query))
        );

        // Process subsections
        const matchedSubsections = section.subsections
          ? filterDocsBySearch(section.subsections, query)
          : [];

        // Include this section if it matches or has matching subsections
        if (titleMatch || contentMatch || codeMatch || matchedSubsections.length > 0) {
          return {
            ...section,
            subsections: matchedSubsections.length > 0 ? matchedSubsections : section.subsections
          };
        }

        // Return null if no match (will be filtered out)
        return null;
      })
      .filter(Boolean) as DocSection[];
  }

  // Render a code example
  const renderCodeExample = (example: NonNullable<DocSection['codeExamples']>[0]) => (
    <div className="my-2 bg-black/30 rounded-md overflow-hidden">
      <div className="bg-black/50 px-3 py-1 text-xs font-medium">{example.title}</div>
      <div className="p-3 font-mono text-sm overflow-x-auto custom-scrollbar">
        <code className="text-primary whitespace-pre">{example.code}</code>
      </div>
      {example.description && (
        <div className="px-3 pb-2 text-xs text-white/70">{example.description}</div>
      )}
    </div>
  );

  // Recursive function to render sections and subsections
  const renderSection = (section: DocSection, depth = 0) => {
    const isExpanded = expandedSections.has(section.id);

    return (
      <div key={section.id} className="mb-4">
        <div
          className={`flex items-center gap-2 cursor-pointer ${depth > 0 ? 'pl-4' : ''}`}
          onClick={() => toggleSection(section.id)}
        >
          <span className="flex items-center justify-center w-5 h-5 text-white/70">
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            )}
          </span>
          <h3 className={`font-medium ${depth > 0 ? 'text-sm' : 'text-base'}`}>{section.title}</h3>
        </div>

        {isExpanded && (
          <div className={`mt-2 ${depth > 0 ? 'pl-6' : 'pl-4'}`}>
            <div className="text-sm text-white/80">{section.content}</div>

            {section.codeExamples?.map((example, i) => (
              <div key={i}>{renderCodeExample(example)}</div>
            ))}

            {section.subsections?.map(subsection => renderSection(subsection, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Get reference to navbar for height calculation
  useEffect(() => {
    const navbar = document.querySelector('nav') || document.querySelector('header');
    if (navbar) {
      (navbarRef as React.RefObject<HTMLDivElement>).current = navbar as HTMLDivElement;
    }
  }, [navbarRef]);

  // Only need one useEffect to get the navbar height

  return (
    <div
      className="overflow-auto custom-scrollbar h-full"
    >
      <h2 className="text-lg font-semibold mb-4">SVG Editor Documentation</h2>

      <div className="mb-4 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 flex-1"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </Button>
          )}
        </div>
        <div className="text-xs text-white/60">
          Tip: Highlight any text in the editor to automatically search for it here
        </div>
      </div>

      <div className="space-y-2 pr-2">
        {filteredDocs.map(section => renderSection(section))}
      </div>
    </div>
  );
}

// Helper to get all section IDs for expanding during search
const getAllSectionIds = (sections: DocSection[]): string[] => {
  return sections.flatMap(section => {
    const ids = [section.id];
    if (section.subsections) {
      return [...ids, ...getAllSectionIds(section.subsections)];
    }
    return ids;
  });
};
