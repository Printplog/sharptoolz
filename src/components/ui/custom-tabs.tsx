import * as React from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: React.ElementType;
  count?: number;
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
      role="tablist"
      className={cn(
        "flex w-fit items-center gap-6 overflow-x-auto",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
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

  return <div role="tabpanel" className={cn("w-full outline-none", className)}>{children}</div>;
}
