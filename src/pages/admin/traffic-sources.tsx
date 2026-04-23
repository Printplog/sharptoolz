import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link as LinkIcon,
  Copy,
  Check,
  Sparkles,
  Share2,
  Globe,
  Send,
  Facebook,
  Plus,
  Users,
  Eye,
  Trash2,
  Loader2,
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { PremiumButton } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { createCampaign, deleteCampaign, getCampaignStats } from "@/api/apiEndpoints";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import type { Campaign, CampaignWithStats } from "@/types";
import { useWebSocketClient } from "@/hooks/useWebSocketClient";

const SOURCE_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "tiktok", label: "TikTok" },
  { value: "google", label: "Google" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X / Twitter" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "newsletter", label: "Newsletter" },
  { value: "partner", label: "Partner" },
  { value: "influencer", label: "Influencer" },
  { value: "qr", label: "QR Code" },
];

const MEDIUM_OPTIONS = [
  { value: "social", label: "Organic Social" },
  { value: "paid_social", label: "Paid Social" },
  { value: "email", label: "Email" },
  { value: "cpc", label: "Paid Search / CPC" },
  { value: "referral", label: "Referral" },
  { value: "organic", label: "Organic Search" },
  { value: "affiliate", label: "Affiliate" },
  { value: "display", label: "Display" },
  { value: "creator", label: "Creator" },
  { value: "sms", label: "SMS" },
  { value: "custom", label: "Custom" },
];

type CampaignFormState = {
  name: string;
  source: string;
  medium: string;
  campaign: string;
  landing_path: string;
  description: string;
  content: string;
  term: string;
  source_platform: string;
  ref_code: string;
};

const INITIAL_FORM_STATE: CampaignFormState = {
  name: "",
  source: "instagram",
  medium: "social",
  campaign: "",
  landing_path: "/",
  description: "",
  content: "",
  term: "",
  source_platform: "",
  ref_code: "",
};

type TrackingLinkShape = Pick<
  Campaign,
  "source" | "medium" | "campaign" | "content" | "term" | "source_platform" | "landing_path" | "ref_code"
>;

const normalizeToken = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const normalizePath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const prettifyToken = (value?: string | null) =>
  (value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const prettifyMedium = (value?: string | null) => prettifyToken(value) || "Direct";

const campaignMatchesVisit = (
  campaign: Pick<CampaignWithStats, "source" | "medium" | "campaign" | "content" | "term" | "source_platform" | "name">,
  visit: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    content?: string | null;
    term?: string | null;
    source_platform?: string | null;
  },
) => {
  const campaignSource = campaign.source || campaign.name;
  const campaignMedium = campaign.medium || "custom";

  if ((visit.source || null) !== campaignSource) return false;
  if ((visit.medium || null) !== campaignMedium) return false;
  if ((campaign.campaign || null) !== (visit.campaign || null)) return false;
  if ((campaign.content || null) !== (visit.content || null)) return false;
  if ((campaign.term || null) !== (visit.term || null)) return false;
  if ((campaign.source_platform || null) !== (visit.source_platform || null)) return false;

  return true;
};

const buildTrackingLink = (campaign: TrackingLinkShape, baseUrl: string) => {
  const url = new URL(normalizePath(campaign.landing_path || "/"), baseUrl);

  if (campaign.source) url.searchParams.set("utm_source", campaign.source);
  if (campaign.medium) url.searchParams.set("utm_medium", campaign.medium);
  if (campaign.campaign) url.searchParams.set("utm_campaign", campaign.campaign);
  if (campaign.content) url.searchParams.set("utm_content", campaign.content);
  if (campaign.term) url.searchParams.set("utm_term", campaign.term);
  if (campaign.source_platform) url.searchParams.set("utm_source_platform", campaign.source_platform);
  if (campaign.ref_code) url.searchParams.set("ref", campaign.ref_code);

  return url.toString();
};

function CreateCampaignDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const queryClient = useQueryClient();

  const updateField = <K extends keyof CampaignFormState>(field: K, value: CampaignFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const normalizedDraft = useMemo(() => {
    const source = normalizeToken(form.source);
    const medium = normalizeToken(form.medium);
    const campaign = normalizeToken(form.campaign);
    const content = normalizeToken(form.content);
    const term = normalizeToken(form.term);
    const sourcePlatform = normalizeToken(form.source_platform) || source;
    const refCode = normalizeToken(form.ref_code);
    const generatedName =
      form.name.trim() ||
      [prettifyToken(source), prettifyToken(medium), prettifyToken(campaign)].filter(Boolean).join(" - ");

    return {
      name: generatedName,
      source,
      medium,
      campaign,
      content,
      term,
      source_platform: sourcePlatform || undefined,
      ref_code: refCode || undefined,
      description: form.description.trim() || undefined,
      landing_path: normalizePath(form.landing_path),
    };
  }, [form]);

  const previewLink =
    typeof window === "undefined"
      ? ""
      : buildTrackingLink(
          {
            source: normalizedDraft.source,
            medium: normalizedDraft.medium,
            campaign: normalizedDraft.campaign || null,
            content: normalizedDraft.content || null,
            term: normalizedDraft.term || null,
            source_platform: normalizedDraft.source_platform || null,
            landing_path: normalizedDraft.landing_path,
            ref_code: normalizedDraft.ref_code || null,
          },
          window.location.origin,
        );

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      toast.success("Tracking campaign created");
      queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
      setForm(INITIAL_FORM_STATE);
      setShowAdvanced(false);
      setIsOpen(false);
    },
    onError: (error: unknown) => {
      if (isAxiosError(error)) {
        toast.error((error.response?.data as { detail?: string } | undefined)?.detail || "Failed to create campaign");
        return;
      }

      toast.error("Failed to create campaign");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!normalizedDraft.source || !normalizedDraft.medium || !normalizedDraft.campaign) {
      toast.error("Source, medium, and campaign are required");
      return;
    }

    if (!normalizedDraft.name) {
      toast.error("Add a campaign label so the admin team can recognize it");
      return;
    }

    mutation.mutate({
      name: normalizedDraft.name,
      source: normalizedDraft.source,
      medium: normalizedDraft.medium,
      campaign: normalizedDraft.campaign,
      content: normalizedDraft.content || undefined,
      term: normalizedDraft.term || undefined,
      source_platform: normalizedDraft.source_platform,
      landing_path: normalizedDraft.landing_path,
      ref_code: normalizedDraft.ref_code,
      description: normalizedDraft.description,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PremiumButton
          text="Create campaign link"
          icon={Plus}
          className="tracking-tight hover:scale-105 primary-glow"
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white tracking-tight">
            Create tracked campaign URL
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">
              Required fields
            </p>
            <p className="mt-2 text-sm text-white/60">
              Most campaigns only need <span className="text-white">source</span>, <span className="text-white">medium</span>, and <span className="text-white">campaign</span>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 ml-1">Campaign label (Optional)</label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Auto-generated if left blank"
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 ml-1">Destination path</label>
              <Input
                value={form.landing_path}
                onChange={(e) => updateField("landing_path", e.target.value)}
                placeholder="/pricing"
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 ml-1">UTM source</label>
              <Select value={form.source} onValueChange={(value) => updateField("source", value)}>
                <SelectTrigger className="w-full h-12 rounded-2xl bg-white/5 border-white/10">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 ml-1">UTM medium</label>
              <Select value={form.medium} onValueChange={(value) => updateField("medium", value)}>
                <SelectTrigger className="w-full h-12 rounded-2xl bg-white/5 border-white/10">
                  <SelectValue placeholder="Select medium" />
                </SelectTrigger>
                <SelectContent>
                  {MEDIUM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/60 ml-1">UTM campaign</label>
              <Input
                value={form.campaign}
                onChange={(e) => updateField("campaign", e.target.value)}
                placeholder="easter_launch"
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-white/60 ml-1">Description (Optional)</label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Short note for the admin team"
                className="min-h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-medium text-white/60 ml-1">Referral code (Optional)</label>
              <Input
                value={form.ref_code}
                onChange={(e) => updateField("ref_code", e.target.value)}
                placeholder="agent_jane"
                className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <button
              type="button"
              onClick={() => setShowAdvanced((current) => !current)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/70">Advanced options</p>
                  <p className="text-[11px] text-white/35">Only use these if you really need extra campaign detail.</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-white/50 transition-transform",
                  showAdvanced && "rotate-180",
                )}
              />
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium text-white/60 ml-1">UTM content</label>
                  <Input
                    value={form.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    placeholder="story_cta_a"
                    className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60 ml-1">UTM term</label>
                  <Input
                    value={form.term}
                    onChange={(e) => updateField("term", e.target.value)}
                    placeholder="document_ai"
                    className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60 ml-1">UTM source platform</label>
                  <Input
                    value={form.source_platform}
                    onChange={(e) => updateField("source_platform", e.target.value)}
                    placeholder="Optional, defaults to source"
                    className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Preview link</p>
                <p className="text-[11px] text-white/30">This is the exact URL your team will share.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-[12px] leading-6 text-white/80 break-all">
              {previewLink}
            </div>
          </div>

          <PremiumButton
            type="submit"
            isLoading={mutation.isPending}
            text={mutation.isPending ? "Saving..." : "Save campaign link"}
            icon={Send}
            className="w-full mt-4"
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CampaignCard({ campaign }: { campaign: CampaignWithStats }) {
  const [copied, setCopied] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const queryClient = useQueryClient();

  const link = buildTrackingLink(campaign, window.location.origin);

  const shareMessage = `Experience SharpToolz in one tap.

Professional document automation, instant SVG editing, and clean export workflows.`;

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .011 5.393 0 12.026c0 2.119.554 4.187 1.605 6.046L0 24l6.126-1.607a11.774 11.774 0 005.92 1.593h.005c6.637 0 12.038-5.393 12.043-12.026a11.75 11.75 0 00-3.515-8.517z" />,
      color: "bg-[#25D366]",
      border: "border-[#25D366]/40",
      onClick: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage}\n\n${link}`)}`, "_blank"),
      isSvg: true,
    },
    {
      name: "X (Twitter)",
      icon: <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />,
      color: "bg-black",
      border: "border-white/20",
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(link)}`, "_blank"),
      isSvg: true,
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-5 h-5 fill-current" />,
      color: "bg-[#1877F2]",
      border: "border-[#1877F2]/40",
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, "_blank"),
    },
    {
      name: "Telegram",
      icon: <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zM17.07 8.16l-1.63 7.69c-.12.53-.44.66-.88.41l-2.48-1.83-1.2 1.15c-.13.13-.24.24-.49.24l.18-2.52 4.6-4.15c.2-.18-.04-.28-.31-.1l-5.69 3.58-2.45-.77c-.53-.17-.54-.53.11-.79l9.53-3.67c.44-.16.82.1.81.76z" />,
      color: "bg-[#0088cc]",
      border: "border-[#0088cc]/40",
      onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareMessage)}`, "_blank"),
      isSvg: true,
    },
  ];

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      toast.success("Campaign deleted");
      queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Tracking link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md hover:border-primary/20 transition-all"
    >
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <LinkIcon size={100} />
      </div>

      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight truncate">
              {campaign.name}
            </h4>
            <p className="text-[11px] text-white/45 font-medium mt-1 truncate">
              {campaign.description || prettifyMedium(campaign.medium)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-200">
                {prettifyMedium(campaign.medium)}
              </div>
              {campaign.campaign && (
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-200">
                  {prettifyToken(campaign.campaign)}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
              <DialogTrigger asChild>
                <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white text-center font-black uppercase italic tracking-tight">
                    Share campaign link
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-4 py-8">
                  {shareOptions.map((option) => (
                    <div key={option.name} className="flex flex-col items-center gap-3">
                      <button
                        onClick={option.onClick}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg border",
                          option.color,
                          option.border,
                        )}
                      >
                        {option.isSvg ? (
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            {option.icon}
                          </svg>
                        ) : (
                          option.icon
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400/60 hover:text-red-400 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white font-bold tracking-tight">Delete campaign?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/40">
                    This removes the saved campaign link from admin. Historical visitor data remains in analytics.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(campaign.id)}
                    className="bg-red-500 text-white hover:bg-red-600 rounded-full"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-violet-400 mb-1">
              <Eye className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Visits</span>
            </div>
            <p className="text-xl font-black text-white">{campaign.visits}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Users className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Users</span>
            </div>
            <p className="text-xl font-black text-white">{campaign.users}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-[11px] text-white/65 break-all">
          {link}
        </div>

        <PremiumButton
          onClick={handleCopy}
          variant="outline"
          text={copied ? "Copied" : "Copy Tracking Link"}
          icon={copied ? Check : Copy}
          className="w-full border-white/10 text-[10px] uppercase tracking-widest"
        />
      </div>
    </motion.div>
  );
}

export default function LinkGenerator() {
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["campaignStats"],
    queryFn: getCampaignStats,
  });

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const baseWsUrl = import.meta.env.VITE_WS_URL;
  const wsUrl = `${protocol}://${baseWsUrl}/ws/activity/`;

  useWebSocketClient<{
    type?: string;
    visitor?: {
      source?: string | null;
      medium?: string | null;
      campaign?: string | null;
      content?: string | null;
      term?: string | null;
      source_platform?: string | null;
      timestamp?: string;
    };
  }>({
    url: wsUrl,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    onMessage: (message) => {
      if (message?.type !== "new_visit" || !message.visitor) return;

      queryClient.setQueryData(["campaignStats"], (current: typeof stats | undefined) => {
        if (!current) return current;

        let matchedCampaign = false;

        const campaigns = current.campaigns.map((campaign) => {
          if (!campaignMatchesVisit(campaign, message.visitor || {})) {
            return campaign;
          }

          matchedCampaign = true;
          return {
            ...campaign,
            visits: campaign.visits + 1,
          };
        });

        if (!matchedCampaign) return current;

        return {
          ...current,
          total_traffic: current.total_traffic + 1,
          campaigns,
        };
      });
    },
  });

  const totalAttributedUsers = stats?.campaigns.reduce((sum, campaign) => sum + campaign.users, 0) ?? 0;
  const socialCampaigns =
    stats?.campaigns.filter((campaign) => ["social", "paid_social"].includes(campaign.medium || "")).length ?? 0;

  const summaryCards: StatData[] = [
    {
      title: "Total Traffic",
      value: stats?.total_traffic ?? 0,
      label: "Visits from saved campaign links",
      icon: Eye,
      gradient: "from-cyan-500/20 to-cyan-600/5",
      borderColor: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-300",
    },
    {
      title: "Campaign Links",
      value: stats?.total_sources ?? 0,
      label: "Structured UTM campaigns",
      icon: Globe,
      gradient: "from-violet-500/20 to-violet-600/5",
      borderColor: "border-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-300",
    },
    {
      title: "Active Today",
      value: stats?.active_today ?? 0,
      label: "Campaigns with traffic today",
      icon: Sparkles,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-300",
    },
    {
      title: "Attributed Users",
      value: totalAttributedUsers,
      label: `${socialCampaigns} social campaigns configured`,
      icon: Users,
      gradient: "from-rose-500/20 to-rose-600/5",
      borderColor: "border-rose-500/20",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-300",
    },
  ];

  if (isLoading) {
    return (
      <div className="dashboard-content">
        <Loader2 className="animate-spin text-primary w-8 h-8 mx-auto mt-20" />
      </div>
    );
  }

  return (
    <div className="dashboard-content space-y-10 pb-10 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Campaign <span className="text-primary">Link Builder</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-white/40 italic">
            Generate clean UTM links, share them fast, and watch attribution come back correctly.
          </p>
        </div>
        <CreateCampaignDialog />
      </div>

      <StatsCards stats={summaryCards} />

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white/40" />
          </div>
          <h2 className="text-lg font-bold text-white uppercase italic tracking-tight">Saved campaign links</h2>
        </div>

        {stats?.campaigns.length === 0 ? (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-20 text-center">
            <p className="text-white/20 italic font-medium">
              No campaign links created yet. Build one and the admin team will have a proper UTM URL ready to share.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats?.campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
