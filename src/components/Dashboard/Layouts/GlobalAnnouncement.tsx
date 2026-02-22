import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/api/apiEndpoints";
import type { SiteSettings } from "@/types";
import { Megaphone, ExternalLink, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function GlobalAnnouncement() {
    const [isVisible, setIsVisible] = useState(true);

    const { data: settings } = useQuery<SiteSettings>({
        queryKey: ["siteSettings"],
        queryFn: getSiteSettings,
    });

    // Re-show when settings change or on mount
    useEffect(() => {
        if (settings?.enable_global_announcement) {
            setIsVisible(true);
        }
    }, [settings?.enable_global_announcement, settings?.updated_at]);

    if (!settings?.enable_global_announcement || !settings?.global_announcement_text || !isVisible) {
        return null;
    }

    const AnnouncementContent = () => (
        <div className="flex items-center gap-3 px-4 py-2 text-sm font-medium">
            <div className="bg-primary/20 p-1.5 rounded-lg flex-shrink-0">
                <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <p className="flex-1 text-white leading-tight">
                {settings.global_announcement_text}
            </p>
            {settings.global_announcement_link && (
                <a
                    href={settings.global_announcement_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all text-xs font-black uppercase tracking-widest"
                >
                    Check out <ExternalLink className="w-3 h-3" />
                </a>
            )}
            <button
                onClick={() => setIsVisible(false)}
                className="text-white/40 hover:text-white p-1 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );

    return (
        <div className="relative z-[10]">
            <div className="bg-[#0a0a0a] border-b border-primary/20 shadow-[0_4px_30px_rgba(var(--primary),0.1)]">
                <div className="max-w-7xl mx-auto">
                    <AnnouncementContent />
                </div>
            </div>
        </div>
    );
}
