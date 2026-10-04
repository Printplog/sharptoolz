import * as React from "react";
import { cn } from "@/lib/utils";

export interface CustomTabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
}

export interface CustomTabsProps {
  tabs: CustomTabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function CustomTabs({ tabs, activeTab, onChange, className, ariaLabel = "Sections" }: CustomTabsProps) {
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const selectAndFocus = (index: number) => {
    const nextTab = tabs[index];
    if (!nextTab) return;
    onChange(nextTab.id);
    tabRefs.current[index]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex w-fit items-center gap-6 overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            ref={(element) => { tabRefs.current[index] = element; }}
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                selectAndFocus((index + 1) % tabs.length);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                selectAndFocus((index - 1 + tabs.length) % tabs.length);
              } else if (event.key === "Home") {
                event.preventDefault();
                selectAndFocus(0);
              } else if (event.key === "End") {
                event.preventDefault();
                selectAndFocus(tabs.length - 1);
              }
            }}
            className={cn(
              "relative flex h-11 shrink-0 items-center gap-2 border-b-2 border-transparent px-0 text-sm font-medium outline-none transition-colors focus-visible:text-white",
              isActive ? "border-primary text-white" : "text-white/40 hover:text-white/70"
            )}
          >
            <span className="flex items-center gap-2">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {tab.label}
              {tab.count !== undefined && <span className="text-xs font-normal text-white/30">{tab.count}</span>}
            </span>
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
  if (activeTab !== value) return null;

  return <div role="tabpanel" tabIndex={0} className={cn("w-full outline-none", className)}>{children}</div>;
}
