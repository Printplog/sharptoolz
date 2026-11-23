import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import {
  confirmOwnerEmailVerification,
  requestOwnerEmailVerification,
  type FernwayEmailVerificationChallenge,
} from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface VerifyAccountEmailBannerProps {
  email?: string;
  description?: string;
  onVerified?: () => void;
  className?: string;
}

export function VerifyAccountEmailBanner({
  email,
  description,
  onVerified,
  className,
}: VerifyAccountEmailBannerProps) {
  const queryClient = useQueryClient();
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [challenge, setChallenge] = useState<FernwayEmailVerificationChallenge | null>(null);
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const displayEmail = email || authUser?.email || "your SharpToolz email";

  const markVerified = () => {
    if (authUser) {
      setUser({
        ...authUser,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      });
    }
    queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
    queryClient.invalidateQueries({ queryKey: ["fernway-account"] });
    queryClient.invalidateQueries({ queryKey: ["fernway-profile"] });
    queryClient.invalidateQueries({ queryKey: ["user"] });
    onVerified?.();
  };

  const handleRequestCode = async () => {
    setIsSending(true);
    try {
      const res = await requestOwnerEmailVerification();
      if (res.already_verified || res.owner_email_verified) {
        markVerified();
        toast.success("Your SharpToolz account email is already verified.");
        return;
      }
      if (res.challenge_id && res.email_hint) {
        setChallenge({
          challenge_id: res.challenge_id,
          email_hint: res.email_hint,
          expires_in: res.expires_in ?? 600,
        });
        setCode("");
        toast.success(`4-digit code sent to ${res.email_hint}`);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not send verification code. Try again.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!challenge || code.length !== 4) {
      toast.error("Enter the 4-digit code sent to your SharpToolz email.");
      return;
    }
    setIsConfirming(true);
    try {
      await confirmOwnerEmailVerification({
        challenge_id: challenge.challenge_id,
        code,
      });
      setChallenge(null);
      setCode("");
      markVerified();
      toast.success("SharpToolz email verified! Active across both Support and Online Banking.");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Verification code is invalid or expired.";
      toast.error(msg);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-400/30 bg-amber-500/[0.08] p-4 space-y-3",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
            <AlertTriangle className="size-4 shrink-0 text-amber-400" />
            Verify your SharpToolz account email
          </div>
          <p className="text-xs text-white/75 leading-relaxed">
            {description || (
              <>
                Verify <strong className="font-mono text-white">{displayEmail}</strong> once so you
                receive Support replies, Online Banking transfer requests, sign-in alerts, and card
                updates.
              </>
            )}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={isSending}
          onClick={handleRequestCode}
          className="rounded-full px-4 shrink-0 w-fit"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <MailCheck className="w-4 h-4 mr-1.5" />
          )}
          {challenge ? "Resend Code" : "Send 4-Digit Code"}
        </Button>
      </div>

      {challenge && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <p className="text-xs text-white/75">
            Enter the 4-digit code sent to{" "}
            <strong className="font-mono text-amber-200">{challenge.email_hint}</strong>:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="0000"
              aria-label="SharpToolz 4-digit verification code"
              className="bg-white/10 border-white/20 text-white text-center font-mono tracking-[0.35em] sm:w-36"
            />
            <Button
              type="button"
              disabled={isConfirming || code.length !== 4}
              onClick={handleConfirmCode}
              className="rounded-full px-5"
            >
              {isConfirming ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
              )}
              Verify My Email
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
