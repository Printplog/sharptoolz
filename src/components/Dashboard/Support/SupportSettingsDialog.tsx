import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Camera, Headphones, Loader2, Settings2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { getOwnerSupportSettings, updateOwnerSupportSettings } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SupportProfile } from "@/types";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

interface SupportSettingsDialogProps {
  compact?: boolean;
  initialProfile?: SupportProfile;
}

export function SupportSettingsDialog({
  compact = false,
  initialProfile,
}: SupportSettingsDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialProfile?.avatar_url ?? null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["support-settings"],
    queryFn: getOwnerSupportSettings,
    initialData: initialProfile,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open || !settings) return;
    setDisplayName(settings.display_name ?? "");
    setSelectedFile(null);
    setRemoveAvatar(false);
    setPreviewUrl(settings.avatar_url ?? null);
  }, [open, settings]);

  useEffect(() => {
    if (!selectedFile) return;
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateOwnerSupportSettings({
        display_name: displayName.trim(),
        avatar: selectedFile,
        remove_avatar: removeAvatar && !selectedFile,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["support-settings"], updated);
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
      setSelectedFile(null);
      setRemoveAvatar(false);
      setPreviewUrl(updated.avatar_url ?? null);
      toast.success("Support settings saved.");
      setOpen(false);
    },
    onError: (err: unknown) => {
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Could not save support settings. Try again.";
      toast.error(detail);
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_MIME.has(file.type)) {
      toast.error("Please upload a PNG, JPG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Support picture must be 5 MB or smaller.");
      return;
    }
    setSelectedFile(file);
    setRemoveAvatar(false);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!saveMutation.isPending) saveMutation.mutate();
  };

  const effectiveAvatar = previewUrl;
  const effectiveName = displayName.trim() || "Support";
  const buttonAvatar = settings?.avatar_url || initialProfile?.avatar_url;

  return (
    <Dialog open={open} onOpenChange={(next) => !saveMutation.isPending && setOpen(next)}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            title="Support settings"
            className="h-7 gap-1.5 rounded-lg border-white/12 bg-white/[0.04] px-2.5 text-[11px] text-white/75 hover:bg-white/10 hover:text-white"
          >
            {buttonAvatar ? (
              <img
                src={buttonAvatar}
                alt="Support profile"
                className="size-4 rounded-full object-cover"
              />
            ) : (
              <Settings2 className="size-3.5" />
            )}
            <span>Settings</span>
          </Button>
        ) : (
          <Button variant="outline" className="shrink-0 gap-2">
            {buttonAvatar ? (
              <img
                src={buttonAvatar}
                alt="Support profile"
                className="size-5 rounded-full object-cover ring-1 ring-white/20"
              />
            ) : (
              <Settings2 className="size-4" />
            )}
            <span>Support settings</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-2xl border-white/10 bg-[#101721] p-0 text-white">
        <DialogHeader className="border-b border-white/10 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-semibold text-white">Support settings</DialogTitle>
          <DialogDescription className="text-xs leading-5 text-white/45">
            Upload your support profile picture and display name. Customers see this across
            ParcelFinda, MyFlightLookup, and Lindenway Banking live chat.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 px-6 py-5">
            {/* Avatar upload row */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative grid size-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/15 bg-emerald-500/15 text-emerald-300 transition hover:border-emerald-400/50"
                aria-label="Choose support picture"
              >
                {effectiveAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt="Support avatar preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <Headphones className="size-7" />
                )}
                <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                  <Camera className="size-5 text-white" />
                </span>
              </button>

              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-sm font-medium text-white">Support picture</p>
                  <p className="text-xs text-white/45">
                    Square photo works best. PNG, JPG, WebP, or GIF up to 5 MB.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 gap-1.5 border-white/15 bg-white/[0.05] text-xs text-white hover:bg-white/10"
                  >
                    <Upload className="size-3.5" />
                    <span>{effectiveAvatar ? "Change picture" : "Upload picture"}</span>
                  </Button>
                  {effectiveAvatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRemovePhoto}
                      className="h-8 gap-1.5 border-red-400/25 bg-red-500/10 text-xs text-red-300 hover:bg-red-500/20 hover:text-red-200"
                    >
                      <Trash2 className="size-3.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Support display name */}
            <div className="space-y-2">
              <label htmlFor="support-display-name" className="text-sm font-medium text-white">
                Support display name{" "}
                <span className="font-normal text-white/40">(optional)</span>
              </label>
              <Input
                id="support-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                maxLength={80}
                placeholder="e.g. Sarah · Support Team"
                className="border-white/15 bg-white/[0.06] text-white placeholder:text-white/30"
              />
              <p className="text-xs text-white/40">
                Shown in the customer chat header, next to your replies, and when you&apos;re typing.
                Leave blank to show &ldquo;Support&rdquo;.
              </p>
            </div>

            {/* Customer preview card */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium tracking-wide text-white/40 uppercase">
                Customer chat preview
              </p>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a131c]">
                <div className="flex items-center gap-3 border-b border-white/10 bg-[#0d231c] px-4 py-3">
                  <div className="relative shrink-0">
                    <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-white/15">
                      {effectiveAvatar ? (
                        <img
                          src={effectiveAvatar}
                          alt={effectiveName}
                          className="size-full object-cover"
                        />
                      ) : (
                        <Headphones className="size-4" />
                      )}
                    </span>
                    <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-[#0d231c] bg-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{effectiveName}</p>
                    <p className="text-[11px] text-emerald-300/90">{effectiveName} is typing...</p>
                  </div>
                </div>
                <div className="flex items-end gap-2.5 p-3.5">
                  <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-500/15 text-emerald-300">
                    {effectiveAvatar ? (
                      <img
                        src={effectiveAvatar}
                        alt={effectiveName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Headphones className="size-3.5" />
                    )}
                  </span>
                  <div className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs text-white/85">
                    Hi! How can we help with your request today?
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 border-t border-white/10 bg-white/[0.02] px-6 py-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saveMutation.isPending}
              onClick={() => setOpen(false)}
              className="border-white/15 bg-white/[0.04] text-white/75 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className={cn("gap-2 px-5 font-semibold")}
            >
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              <span>{saveMutation.isPending ? "Saving..." : "Save settings"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
