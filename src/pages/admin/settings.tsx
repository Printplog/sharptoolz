import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSiteSettings, updateSiteSettings, requestSettingsVerificationCode } from "@/api/apiEndpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
    crypto_address: "",
    whatsapp_number: "",
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
        crypto_address: settings.crypto_address || "",
        whatsapp_number: settings.whatsapp_number || "",
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground">Manage payment details and site configuration.</p>
        </div>
      </div>

      <Card className="bg-white/5 border border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Payment Configuration</CardTitle>
          <CardDescription>These details are shown to users for manual payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="crypto">Crypto Wallet Address (USDT/BEP20)</Label>
            <Input
              id="crypto"
              value={formData.crypto_address}
              onChange={(e) => setFormData({ ...formData, crypto_address: e.target.value })}
              className="bg-white/5 border-white/10"
              placeholder="Enter USDT address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp Number for Manual Payment</Label>
            <Input
              id="whatsapp"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              className="bg-white/5 border-white/10"
              placeholder="+234..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual">Manual Purchase Instructions</Label>
            <Textarea
              id="manual"
              value={formData.manual_purchase_text}
              onChange={(e) => setFormData({ ...formData, manual_purchase_text: e.target.value })}
              className="bg-white/5 border-white/10 min-h-[150px]"
              placeholder="Enter instructions for manual template purchases..."
            />
          </div>

          <Button
            onClick={handleSaveClick}
            className="w-full sm:w-auto gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Security Challenge Dialog */}
      <Dialog open={isChallengeOpen} onOpenChange={setIsChallengeOpen}>
        <DialogContent className="bg-[#0a0a0c] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Security Verification
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Please verify your email to authorize changes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp">Verification Code</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-primary"
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
                className="bg-white/5 border-white/10"
                placeholder="6-digit code"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChallengeOpen(false)}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpdate}
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Verify & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
