import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { PremiumButton } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/input";
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
import { getCampaignStats, createCampaign, deleteCampaign } from "@/api/apiEndpoints";
import { StatsCards, type StatData } from "@/components/Admin/Shared/StatsCards";
import type { CampaignWithStats } from "@/types";

function CreateCampaignDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [refCode, setRefCode] = useState("");

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      toast.success("Campaign source created and saved!");
      queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
      setIsOpen(false);
      setName("");
      setDescription("");
      setRefCode("");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to create campaign");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Source name is required");
    mutation.mutate({ name: name.trim(), description, ref_code: refCode });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PremiumButton 
          text="Create source"
          icon={Plus}
          className="tracking-tight hover:scale-105 primary-glow"
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-900 border-white/20 rounded-[2rem] p-8 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white tracking-tight">Create new source</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 ml-1">Source name (Required)</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Facebook_Ads"
              className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
            />
            <p className="text-[10px] text-white/20 italic ml-1">Used in URL: ?source=Facebook_Ads</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 ml-1">Optional description</label>
            <Input 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summer 2024 Campaign"
              className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60 ml-1">Referral code (Optional)</label>
            <Input 
              value={refCode}
              onChange={(e) => setRefCode(e.target.value)}
              placeholder="e.g. admin"
              className="bg-white/5 border-white/10 h-12 rounded-2xl text-white"
            />
          </div>

          <PremiumButton 
            type="submit" 
            isLoading={mutation.isPending}
            text={mutation.isPending ? "Generating..." : "Save & generate link"}
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
  
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();
  params.append("source", campaign.name);
  if (campaign.ref_code) params.append("ref", campaign.ref_code);
  const link = `${baseUrl}/?${params.toString()}`;

  const shareMessage = `🚀 Experience the future of document creation with SharpToolz!

✅ Professional Document Automation
✅ Instant SVG Editing & Watermark-free PDFs

Auto-customize your workflow in seconds!`;

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .011 5.393 0 12.026c0 2.119.554 4.187 1.605 6.046L0 24l6.126-1.607a11.774 11.774 0 005.92 1.593h.005c6.637 0 12.038-5.393 12.043-12.026a11.75 11.75 0 00-3.515-8.517z" />,
      color: "bg-[#25D366]",
      border: "border-[#25D366]/40",
      onClick: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareMessage} ${link}`)}`, '_blank'),
      isSvg: true
    },
    {
      name: "X (Twitter)",
      icon: <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />,
      color: "bg-black",
      border: "border-white/20",
      onClick: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(link)}`, '_blank'),
      isSvg: true
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-5 h-5 fill-current" />,
      color: "bg-[#1877F2]",
      border: "border-[#1877F2]/40",
      onClick: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank'),
    },
    {
      name: "Telegram",
      icon: <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zM17.07 8.16l-1.63 7.69c-.12.53-.44.66-.88.41l-2.48-1.83-1.2 1.15c-.13.13-.24.24-.49.24l.18-2.52 4.6-4.15c.2-.18-.04-.28-.31-.1l-5.69 3.58-2.45-.77c-.53-.17-.54-.53.11-.79l9.53-3.67c.44-.16.82.1.81.76z" />,
      color: "bg-[#0088cc]",
      border: "border-[#0088cc]/40",
      onClick: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareMessage)}`, '_blank'),
      isSvg: true
    }
  ];

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      toast.success("Campaign deleted");
      queryClient.invalidateQueries({ queryKey: ["campaignStats"] });
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Tracking link copied!");
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
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-lg font-black text-white uppercase italic tracking-tight truncate max-w-[150px]">
              {campaign.name}
            </h4>
            <p className="text-[10px] text-white/40 font-medium truncate max-w-[150px]">
              {campaign.description || "No description"}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
              <DialogTrigger asChild>
                <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                  <Share2 className="w-4 h-4" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-gray-900 border-white/20 rounded-[2rem] text-white">
                <DialogHeader>
                  <DialogTitle className="text-white text-center font-black uppercase italic tracking-tight">Share Tracking Link</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-4 gap-4 py-8">
                  {shareOptions.map((option) => (
                    <div key={option.name} className="flex flex-col items-center gap-3 group/share">
                      <button
                        onClick={option.onClick}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg border",
                          option.color,
                          option.border
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
              <AlertDialogContent className="bg-gray-900 border-white/20 rounded-[2rem] text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white font-bold tracking-tight">Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/40">
                    This will permanently delete the tracking source "{campaign.name}" and its associated campaign data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-full">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteMutation.mutate(campaign.id)}
                    className="bg-red-500 text-white hover:bg-red-600 rounded-full"
                  >
                    Delete campaign
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
  const { data: stats, isLoading } = useQuery({
    queryKey: ["campaignStats"],
    queryFn: getCampaignStats,
  });

  const summaryCards: StatData[] = [
    {
      title: "Total Traffic",
      value: stats?.total_traffic ?? 0,
      label: "Across all sources",
      icon: Eye,
      gradient: "from-cyan-500/20 to-cyan-600/5",
      borderColor: "border-cyan-500/20",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-300",
    },
    {
      title: "Total Sources",
      value: stats?.total_sources ?? 0,
      label: "Configured campaigns",
      icon: Globe,
      gradient: "from-violet-500/20 to-violet-600/5",
      borderColor: "border-violet-500/20",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-300",
    },
    {
      title: "Active Today",
      value: stats?.active_today ?? 0,
      label: "Performing campaigns",
      icon: Sparkles,
      gradient: "from-emerald-500/20 to-emerald-600/5",
      borderColor: "border-emerald-500/20",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-300",
    },
    {
      title: "Referral Source",
      value: stats?.campaigns.find(c => c.name === 'referral')?.visits ?? 0,
      label: "Natural referrals",
      icon: Users,
      gradient: "from-rose-500/20 to-rose-600/5",
      borderColor: "border-rose-500/20",
      iconBg: "bg-rose-500/10",
      iconColor: "text-rose-300",
    },
  ];

  if (isLoading) return <div className="dashboard-content"><Loader2 className="animate-spin text-primary w-8 h-8 mx-auto mt-20" /></div>;

  return (
    <div className="dashboard-content space-y-10 pb-10 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Traffic <span className="text-primary">Source Manager</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-white/40 italic">
            Manage tracking links and monitor campaign performance
          </p>
        </div>
        <CreateCampaignDialog onSuccess={() => {}} />
      </div>

      <StatsCards stats={summaryCards} />

      <div className="space-y-6">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-white/40" />
            </div>
            <h2 className="text-lg font-bold text-white uppercase italic tracking-tight">Active campaigns</h2>
        </div>

        {stats?.campaigns.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-20 text-center">
                <p className="text-white/20 italic font-medium">No campaigns created yet. Click 'Create Source' to get started.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats?.campaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
