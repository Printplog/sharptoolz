import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface CustomTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function CustomTabs({ tabs, activeTab, onChange, className }: CustomTabsProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-full w-fit mx-auto lg:mx-0",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white/20",
              isActive ? "text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
            </span>
            
            {isActive && (
              <motion.div
                layoutId="active-tab-bg"
                className="absolute inset-0 bg-white/5 border border-white/10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface CustomTabsContentProps {
  value: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function CustomTabsContent({ value, activeTab, children, className }: CustomTabsContentProps) {
  return (
    <AnimatePresence mode="wait">
      {activeTab === value && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={cn("w-full outline-none", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
