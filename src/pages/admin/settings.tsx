import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSiteSettings, updateSiteSettings, requestSettingsVerificationCode } from "@/api/apiEndpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ShieldCheck, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import type { SiteSettings } from "@/types";
import SettingsSkeleton from "@/components/Admin/Layouts/SettingsSkeleton";

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<SiteSettings>>({
    whatsapp_number: "",
    support_email: "",
    telegram_link: "",
    twitter_link: "",
    instagram_link: "",
    min_topup_amount: "",
    crypto_address: "",
    funding_whatsapp_number: "",
    exchange_rate_override: "",
    maintenance_mode: false,
    disable_new_signups: false,
    disable_deposits: false,
    global_announcement_text: "",
    global_announcement_link: "",
    enable_global_announcement: false,
    manual_purchase_text: "",
  });

  const [isChallengeOpen, setIsChallengeOpen] = useState(false);
  const [answers, setAnswers] = useState({ otp: "" });
  const [isSendingCode, setIsSendingCode] = useState(false);

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["siteSettings"],
    queryFn: getSiteSettings,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        whatsapp_number: settings.whatsapp_number || "",
        support_email: settings.support_email || "",
        telegram_link: settings.telegram_link || "",
        twitter_link: settings.twitter_link || "",
        instagram_link: settings.instagram_link || "",
        min_topup_amount: settings.min_topup_amount || "",
        crypto_address: settings.crypto_address || "",
        funding_whatsapp_number: settings.funding_whatsapp_number || "",
        exchange_rate_override: settings.exchange_rate_override || "",
        maintenance_mode: settings.maintenance_mode || false,
        disable_new_signups: settings.disable_new_signups || false,
        disable_deposits: settings.disable_deposits || false,
        global_announcement_text: settings.global_announcement_text || "",
        global_announcement_link: settings.global_announcement_link || "",
        enable_global_announcement: settings.enable_global_announcement || false,
        manual_purchase_text: settings.manual_purchase_text || "",
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SiteSettings> & { otp: string }) =>
      updateSiteSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
      toast.success("Settings updated successfully!");
      setIsChallengeOpen(false);
      setAnswers({ otp: "" });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const msg = error.response?.data?.error || "Failed to update settings.";
      toast.error(msg);
    },
  });

  const handleRequestCode = async () => {
    setIsSendingCode(true);
    try {
      const res = await requestSettingsVerificationCode();
      toast.success(res.message);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to send code.";
      toast.error(msg);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSaveClick = () => {
    setIsChallengeOpen(true);
  };

  const handleConfirmUpdate = () => {
    if (!answers.otp) {
      toast.error("Please provide the verification code.");
      return;
    }
    updateMutation.mutate({
      ...formData,
      otp: answers.otp,
    });
  };

  if (isLoading) return <SettingsSkeleton />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
            Site <span className="text-primary">Settings</span>
          </h1>
          <p className="text-white/50 text-sm mt-1">Configure your platform's global behavior</p>
        </div>
        <Button
          onClick={handleSaveClick}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-xs px-6 py-5 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all"
        >
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="support" className="space-y-6">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-auto">
          <TabsTrigger value="support" className="rounded-xl px-6 py-3 text-sm font-bold">Contact & Support</TabsTrigger>
          <TabsTrigger value="financial" className="rounded-xl px-6 py-3 text-sm font-bold">Financial</TabsTrigger>
          <TabsTrigger value="toggles" className="rounded-xl px-6 py-3 text-sm font-bold">Platform Toggles</TabsTrigger>
          <TabsTrigger value="branding" className="rounded-xl px-6 py-3 text-sm font-bold">Branding Defaults</TabsTrigger>
        </TabsList>

        {/* 1. Contact & Support Tab */}
        <TabsContent value="support" className="space-y-6 focus:outline-none focus-visible:outline-none">
          <Card className="bg-white/5 border-white/10 backdrop-blur-3xl overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 px-8 pt-8 pb-6">
              <CardTitle className="text-xl font-bold italic uppercase">Support Configurations</CardTitle>
              <CardDescription className="text-white/50">Manage how users contact you and join your communities.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="whatsapp_number" className="text-white/70 text-xs font-black uppercase tracking-widest">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="2349160914217"
                  />
                  <p className="text-[11px] text-white/40">Used for manual Naira payments and fallback support.</p>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="support_email" className="text-white/70 text-xs font-black uppercase tracking-widest">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={formData.support_email}
                    onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="support@domain.com"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="telegram_link" className="text-white/70 text-xs font-black uppercase tracking-widest">Telegram Link</Label>
                  <Input
                    id="telegram_link"
                    type="url"
                    value={formData.telegram_link}
                    onChange={(e) => setFormData({ ...formData, telegram_link: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="https://t.me/yourgroup"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="twitter_link" className="text-white/70 text-xs font-black uppercase tracking-widest">Twitter (X) Link</Label>
                  <Input
                    id="twitter_link"
                    type="url"
                    value={formData.twitter_link}
                    onChange={(e) => setFormData({ ...formData, twitter_link: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="https://x.com/yourhandle"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Financial Tab */}
        <TabsContent value="financial" className="space-y-6 focus:outline-none focus-visible:outline-none">
          <Card className="bg-white/5 border-white/10 backdrop-blur-3xl overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 px-8 pt-8 pb-6">
              <CardTitle className="text-xl font-bold italic uppercase">Wallet & Exchange</CardTitle>
              <CardDescription className="text-white/50">Manage top-up constraints and crypto fallbacks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="min_topup" className="text-white/70 text-xs font-black uppercase tracking-widest">Min Top-Up (USD)</Label>
                  <Input
                    id="min_topup"
                    type="number"
                    value={formData.min_topup_amount}
                    onChange={(e) => setFormData({ ...formData, min_topup_amount: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20 font-mono"
                    placeholder="5.00"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="exchange_rate" className="text-white/70 text-xs font-black uppercase tracking-widest">Dollar/Naira Override</Label>
                  <Input
                    id="exchange_rate"
                    type="number"
                    value={formData.exchange_rate_override}
                    onChange={(e) => setFormData({ ...formData, exchange_rate_override: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20 font-mono"
                    placeholder="1650.00"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="funding_whatsapp" className="text-white/70 text-xs font-black uppercase tracking-widest">Funding WhatsApp (Naira Payments)</Label>
                  <Input
                    id="funding_whatsapp"
                    value={formData.funding_whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, funding_whatsapp_number: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20"
                    placeholder="234..."
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="crypto_address" className="text-white/70 text-xs font-black uppercase tracking-widest">Master Crypto Address (USDT BEP20)</Label>
                  <Input
                    id="crypto_address"
                    value={formData.crypto_address}
                    onChange={(e) => setFormData({ ...formData, crypto_address: e.target.value })}
                    className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20 font-mono text-sm"
                    placeholder="0x..."
                  />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="manual" className="text-white/70 text-xs font-black uppercase tracking-widest">Manual Purchase Instructions</Label>
                  <Textarea
                    id="manual"
                    value={formData.manual_purchase_text}
                    onChange={(e) => setFormData({ ...formData, manual_purchase_text: e.target.value })}
                    className="bg-white/5 border-white/10 min-h-[100px] rounded-xl focus:ring-primary/20"
                    placeholder="Instructions shown on manual purchase..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Platform Toggles Tab */}
        <TabsContent value="toggles" className="space-y-6 focus:outline-none focus-visible:outline-none">
          <Card className="bg-white/5 border-white/10 backdrop-blur-3xl overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 px-8 pt-8 pb-6">
              <CardTitle className="text-xl font-bold italic uppercase">Kill Switches</CardTitle>
              <CardDescription className="text-white/50">Emergency controls for your platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-8">
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-white">Maintenance Mode</Label>
                  <p className="text-sm text-white/50">Blocks non-admins from logging in.</p>
                </div>
                <Switch
                  checked={formData.maintenance_mode}
                  onCheckedChange={(checked) => setFormData({ ...formData, maintenance_mode: checked })}
                  className="data-[state=checked]:bg-red-500"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-white">Disable New Signups</Label>
                  <p className="text-sm text-white/50">Prevents users from creating new accounts.</p>
                </div>
                <Switch
                  checked={formData.disable_new_signups}
                  onCheckedChange={(checked) => setFormData({ ...formData, disable_new_signups: checked })}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold text-white">Disable Deposits</Label>
                  <p className="text-sm text-white/50">Locks the wallet top-up functionality globally.</p>
                </div>
                <Switch
                  checked={formData.disable_deposits}
                  onCheckedChange={(checked) => setFormData({ ...formData, disable_deposits: checked })}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Branding Tab */}
        <TabsContent value="branding" className="space-y-6 focus:outline-none focus-visible:outline-none">
          <Card className="bg-white/5 border-white/10 backdrop-blur-3xl overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-white/[0.02] border-b border-white/5 px-8 pt-8 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold italic uppercase">Global Announcement</CardTitle>
                  <CardDescription className="text-white/50">Show a banner message at the top of the user dashboard.</CardDescription>
                </div>
                <Switch
                  checked={formData.enable_global_announcement}
                  onCheckedChange={(checked) => setFormData({ ...formData, enable_global_announcement: checked })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-3">
                <Label htmlFor="announcement_text" className="text-white/70 text-xs font-black uppercase tracking-widest">Banner Text</Label>
                <Input
                  id="announcement_text"
                  value={formData.global_announcement_text}
                  onChange={(e) => setFormData({ ...formData, global_announcement_text: e.target.value })}
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20"
                  placeholder="e.g. ⚠️ Scheduled maintenance on Sunday at 2 AM"
                  disabled={!formData.enable_global_announcement}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="announcement_link" className="text-white/70 text-xs font-black uppercase tracking-widest">Clickable Link (Optional)</Label>
                <Input
                  id="announcement_link"
                  type="url"
                  value={formData.global_announcement_link}
                  onChange={(e) => setFormData({ ...formData, global_announcement_link: e.target.value })}
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/20"
                  placeholder="https://t.me/yourgroup"
                  disabled={!formData.enable_global_announcement}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Challenge Dialog */}
      <Dialog open={isChallengeOpen} onOpenChange={setIsChallengeOpen}>
        <DialogContent className="bg-[#0a0a0c] border border-white/10 text-white sm:max-w-[425px] rounded-[2rem] p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Verify Identity
            </DialogTitle>
            <DialogDescription className="text-white/50">
              Settings changes require authorization. We'll send a code to your admin email.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp" className="text-xs font-black uppercase tracking-widest text-white/70">Secure PIN</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-primary font-bold"
                  onClick={handleRequestCode}
                  disabled={isSendingCode}
                >
                  {isSendingCode ? "Sending..." : "Send Code"}
                </Button>
              </div>
              <Input
                id="otp"
                value={answers.otp}
                onChange={(e) => setAnswers({ ...answers, otp: e.target.value })}
                className="bg-white/5 border-white/10 h-14 rounded-xl text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="------"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter className="mt-8 gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsChallengeOpen(false)}
              className="border-white/10 hover:bg-white/5 rounded-xl h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              disabled={updateMutation.isPending}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-bold px-6"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Confirm Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
