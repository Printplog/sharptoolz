import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Link2,
  Mail,
  MessageCircle,
  MessageCircleMore,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { fetchCurrentUser, markUpdateSeen } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { unseenReleases, type ReleaseHighlightIcon } from "@/lib/whatsNew";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";

function HighlightIcon({ kind }: { kind?: ReleaseHighlightIcon }) {
  switch (kind) {
    case "typing":
      return <MessageCircleMore className="size-[17px]" />;
    case "profile":
      return <UserRoundCheck className="size-[17px]" />;
    case "banking":
      return <Landmark className="size-[17px]" />;
    case "chat":
      return <MessageCircle className="size-[17px]" />;
    case "mail":
      return <Mail className="size-[17px]" />;
    case "link":
      return <Link2 className="size-[17px]" />;
    default:
      return <Check className="size-[17px]" />;
  }
}

export default function WhatsNewDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Same query as ProtectedLayout, so this waits for the fresh user rather than the stored copy
  const { data: user } = useQuery<User>({ queryKey: ["currentUser"], queryFn: fetchCurrentUser });
  const setUser = useAuthStore((state) => state.setUser);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const releases = useMemo(() => (user ? unseenReleases(user) : []), [user]);
  const newestRelease = releases[0];
  const clampedIndex = Math.min(activeIndex, Math.max(0, releases.length - 1));
  const release = releases[clampedIndex];

  const seenMutation = useMutation({
    mutationFn: markUpdateSeen,
    onSuccess: (updated) => {
      queryClient.setQueryData<User>(["currentUser"], updated);
      setUser(updated);
    },
  });

  if (!user || !newestRelease || !release || dismissed === newestRelease.id) return null;

  const close = () => {
    // Hide right away; the server remembers the latest release for this user's other devices
    setDismissed(newestRelease.id);
    seenMutation.mutate(newestRelease.id);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-2rem)] max-w-[496px] max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-[24px] border border-white/[0.09] bg-[#0d131c] p-0 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.85)] outline-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement).focus();
        }}
      >
        {/* Subtle top hairline accent */}
        <div
          aria-hidden="true"
          className="h-px w-full bg-gradient-to-r from-transparent via-primary/45 to-transparent"
        />

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-5 text-left sm:px-7 sm:pt-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                What&apos;s new
              </span>
              <span className="text-xs font-medium text-white/40">
                {format(new Date(`${release.date}T00:00:00`), "d MMM yyyy")}
              </span>
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="Close what's new"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 transition-colors hover:bg-white/[0.09] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <X className="size-4" />
            </button>
          </div>

          <DialogTitle className="font-[family-name:var(--font-fancy)] text-[22px] leading-[1.2] font-semibold tracking-[-0.02em] text-white sm:text-[24px]">
            {release.title}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-[14px] leading-[1.6] text-white/55">
            {release.summary}
          </DialogDescription>
        </DialogHeader>

        {/* Clean grouped highlights list */}
        <div className="px-6 pb-6 sm:px-7">
          <ul className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.07] bg-white/[0.025]">
            {release.highlights.map((highlight) => (
              <li key={highlight.title} className="flex items-start gap-3.5 px-4 py-3.5 sm:px-4.5 sm:py-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/[0.08] text-primary">
                  <HighlightIcon kind={highlight.icon} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] leading-snug font-semibold text-white/95">
                    {highlight.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-[1.55] text-white/55">
                    {highlight.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.015] px-6 py-4 sm:flex-row sm:justify-between sm:px-7">
          {releases.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                disabled={clampedIndex === 0}
                aria-label="Newer update"
                className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="min-w-[2.5rem] text-center text-xs font-medium tabular-nums text-white/45">
                {clampedIndex + 1} / {releases.length}
              </span>
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.min(releases.length - 1, i + 1))}
                disabled={clampedIndex === releases.length - 1}
                aria-label="Previous update"
                className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-full px-4 text-[13px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white"
              onClick={close}
            >
              {release.action ? "Later" : "Done"}
            </Button>
            {release.action && (
              <Button
                type="button"
                size="sm"
                data-primary-action
                className="h-9 gap-1.5 rounded-full px-4.5 text-[13px] font-semibold focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d131c]"
                onClick={() => {
                  close();
                  navigate(release.action!.to);
                }}
              >
                <span>{release.action.label}</span>
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
