import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Check, Sparkles } from "lucide-react";
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
import { unseenReleases } from "@/lib/whatsNew";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";

export default function WhatsNewDialog() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Same query as ProtectedLayout, so this waits for the fresh user rather than the stored copy
  const { data: user } = useQuery<User>({ queryKey: ["currentUser"], queryFn: fetchCurrentUser });
  const setUser = useAuthStore((state) => state.setUser);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const releases = useMemo(() => (user ? unseenReleases(user) : []), [user]);
  const release = releases[0];

  const seenMutation = useMutation({
    mutationFn: markUpdateSeen,
    onSuccess: (updated) => {
      queryClient.setQueryData<User>(["currentUser"], updated);
      setUser(updated);
    },
  });

  if (!user || !release || dismissed === release.id) return null;

  const close = () => {
    // Hide right away; the server remembers it for this user's other devices
    setDismissed(release.id);
    seenMutation.mutate(release.id);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-lg gap-0 overflow-hidden rounded-xl border-white/10 bg-[#101721] p-0"
        onOpenAutoFocus={(event) => {
          // Focus the main action instead of the first button ("Maybe later")
          event.preventDefault();
          (event.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-primary-action]")?.focus();
        }}
      >
        <DialogHeader className="border-b border-white/10 px-6 pt-6 pb-5 pr-12 text-left">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            <span>What&apos;s new</span>
            <span className="text-white/25">·</span>
            <span className="text-white/40">{format(new Date(`${release.date}T00:00:00`), "d MMM yyyy")}</span>
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight text-white">{release.title}</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-6 text-white/50">{release.summary}</DialogDescription>
        </DialogHeader>

        <ul className="px-6 py-2">
          {release.highlights.map((highlight) => (
            <li key={highlight.title} className="flex gap-3 border-b border-white/[0.07] py-4 last:border-0">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Check className="size-3" />
              </span>
              <div>
                <h3 className="text-sm font-medium text-white/85">{highlight.title}</h3>
                <p className="mt-1 text-sm leading-6 text-white/45">{highlight.description}</p>
              </div>
            </li>
          ))}
        </ul>

        {releases.length > 1 && (
          <p className="px-6 pb-2 text-xs text-white/35">
            Also new: {releases.slice(1).map((older) => older.title).join(", ")}
          </p>
        )}

        <DialogFooter className="flex-col-reverse gap-2 border-t border-white/10 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" className="text-white/60" onClick={close}>
            {release.action ? "Maybe later" : "Got it"}
          </Button>
          {release.action && (
            <Button
              data-primary-action
              onClick={() => {
                close();
                navigate(release.action!.to);
              }}
            >
              {release.action.label} <ArrowRight className="size-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
