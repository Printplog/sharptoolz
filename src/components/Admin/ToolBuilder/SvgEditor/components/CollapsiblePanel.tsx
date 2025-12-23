import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CollapsiblePanelProps {
  id: string; // Required for drag-and-drop
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dragHandle?: boolean;
  className?: string;
  headerActions?: React.ReactNode;
  forceMount?: boolean;
  animate?: boolean;
}

export function CollapsiblePanel({
  id,
  title,
  children,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  dragHandle = false,
  className,
  headerActions,
  forceMount = false,
  animate = true,
}: CollapsiblePanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen ?? internalIsOpen;

  const toggle = () => {
    const newState = !isOpen;
    if (onOpenChange) {
      onOpenChange(newState);
    } else {
      setInternalIsOpen(newState);
    }
  };

  const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
  } = useSortable({ id });

  const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.8 : 1,
  };

  // Optimization: If not animating, we just toggle visibility instantly
  // If forceMount is true, we keep it in DOM but hidden
  
  const content = (
    <div className={cn("p-4 border-t border-white/5", !isOpen && forceMount && "hidden")}>
        {children}
    </div>
  );

  return (
    <div 
        ref={dragHandle ? setNodeRef : undefined}
        style={dragHandle ? style : undefined}
        className={cn("bg-zinc-900/50 backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden flex flex-col", className)}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5 select-none"
      >
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
             {dragHandle && (
                <div {...attributes} {...listeners} className="cursor-grab hover:text-white text-white/40 active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                </div>
             )}
            <button 
                onClick={toggle}
                className="flex items-center gap-2 flex-1 text-left min-w-0"
            >
                <div className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                    <ChevronDown className="h-4 w-4 text-white/50" />
                </div>
                <span className="text-sm font-medium text-white/90 truncate">{title}</span>
            </button>
        </div>
        
        <div className="flex items-center gap-2">
            {headerActions}
        </div>
      </div>

      {/* Content */}
      {animate ? (
        <AnimatePresence initial={false}>
            {(isOpen || forceMount) && (
              <motion.div
                initial={false}
                animate={{ 
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={cn("overflow-hidden", !isOpen && forceMount && "hidden")} // Ensure hidden applies even during animation
                style={{ display: !isOpen && forceMount ? 'none' : 'block' }}
              >
               {content}
              </motion.div>
            )}
        </AnimatePresence>
      ) : (
          (isOpen || forceMount) ? content : null
      )}
    </div>
  );
}
