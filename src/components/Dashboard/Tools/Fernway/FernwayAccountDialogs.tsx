import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Mail,
  MailX,
  RefreshCw,
  Send,
  ShieldCheck,
  TestTube,
  Wallet,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FancyProgress } from "@/components/ui/FancyProgress";

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTest: (sendCredentialsEmail: boolean) => void;
  onCreateLive: (sendCredentialsEmail: boolean) => void;
  isSubmitting: boolean;
  price: number;
  walletBalance: number;
  recipientEmail?: string;
  error?: string | null;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  onCreateTest,
  onCreateLive,
  isSubmitting,
  price,
  walletBalance,
  recipientEmail,
  error,
}: CreateAccountDialogProps) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<"delivery" | "plan">("delivery");
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(false);

  useEffect(() => {
    if (isSubmitting) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 15));
      }, 250);
      return () => clearInterval(interval);
    } else if (!error) {
      setProgress((prev) => (prev > 0 && prev < 100 ? 100 : prev));
    } else {
      setProgress(0);
    }
  }, [isSubmitting, error]);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setStep("delivery");
      setSendCredentialsEmail(false);
    }
  }, [open]);

  const handleChooseDelivery = (shouldEmail: boolean) => {
    setSendCredentialsEmail(shouldEmail);
    setStep("plan");
  };

  const isInsufficientFunds = error?.toLowerCase().includes("insufficient");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none"
        showCloseButton={false}
        noShadow
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div
                key="submitting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-center py-4"
              >
                <div className="relative w-16 h-16 mx-auto">
                  <div className="relative z-10 w-full h-full bg-primary/5 rounded-full flex items-center justify-center border border-primary/20">
                    <ShieldCheck className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white tracking-tight">
                    Creating account
                  </h2>
                  <p className="text-white/40 text-xs">Setting up your Fernway banking portal</p>
                </div>
                <div className="px-4">
                  <FancyProgress
                    value={progress}
                    statusText="Finalizing..."
                    isComplete={false}
                    noShadow
                  />
                </div>
              </motion.div>
            ) : progress === 100 ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 mx-auto bg-green-500/5 rounded-full flex items-center justify-center border border-green-500/20">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-white">Ready!</h2>
                  <p className="text-white/40 text-xs">Your banking account is ready to use.</p>
                </div>
                <div className="px-4">
                  <FancyProgress value={100} isComplete={true} statusText="Success" noShadow />
                </div>
              </motion.div>
            ) : step === "delivery" && recipientEmail ? (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-7"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                    <Mail className="size-3" />
                    Step 1 of 2
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Email sign-in details?
                  </h2>
                  <p className="text-white/50 text-sm leading-relaxed">
                    Would you like us to email the banking portal link, login email, password, and transaction PIN directly to{" "}
                    <span className="font-mono text-emerald-300 break-all">{recipientEmail}</span> instead of sending in DMs?
                  </p>
                </div>

                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => handleChooseDelivery(true)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/15 hover:bg-primary/10 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform shrink-0">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-primary font-semibold">Yes, email sign-in details</h3>
                      <p className="text-primary/65 text-xs">
                        Send directly to their inbox as soon as the account is created
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChooseDelivery(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shrink-0">
                      <MailX className="w-5 h-5 text-white/55" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white/90 font-medium">No, I&apos;ll share it myself</h3>
                      <p className="text-white/45 text-xs">
                        Skip for now — you can still send or resend it anytime later
                      </p>
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="w-full py-3 rounded-xl border border-white/5 bg-white/2 text-white/40 hover:text-white/80 hover:bg-white/5 font-medium transition-all active:scale-95 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="choice"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-7"
              >
                <div className="space-y-3">
                  {recipientEmail && (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setStep("delivery")}
                        className="inline-flex items-center gap-1 text-xs font-medium text-white/55 hover:text-white transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="size-3.5" />
                        Back
                      </button>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/70">
                        {sendCredentialsEmail ? (
                          <>
                            <Mail className="size-3 text-emerald-400" />
                            Emailing details to client
                          </>
                        ) : (
                          <>
                            <MailX className="size-3 text-white/45" />
                            Not emailing now
                          </>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Select option</h2>
                    <p className="text-white/45 text-sm">
                      Each live account has its own monthly subscription paid from your crypto wallet.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                      <p className="text-red-400 text-sm font-medium leading-relaxed">{error}</p>
                      {isInsufficientFunds && (
                        <Link
                          to="/wallet"
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600/60 hover:bg-green-600/80 text-white rounded-lg transition-all font-bold text-sm"
                        >
                          <Wallet className="w-4 h-4" />
                          Fund Wallet with Crypto
                        </Link>
                      )}
                    </div>
                  )}

                  {!error && (
                    <p className="text-xs text-amber-300/85 font-medium leading-relaxed text-left">
                      Test accounts show a simulation notice at the top of Fernway. Live accounts renew monthly — we&apos;ll send a reminder before each renewal date.
                    </p>
                  )}
                </div>

                <div className="grid gap-3">
                  {/* Test Option */}
                  <button
                    type="button"
                    onClick={() => onCreateTest(sendCredentialsEmail)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                      <TestTube className="w-5 h-5 text-white/55" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-white/90 font-medium">Test Account</h3>
                        <span className="text-xs font-semibold text-white/50">Free</span>
                      </div>
                      <p className="text-white/40 text-xs">
                        Shows simulation notice at top of Fernway
                      </p>
                    </div>
                  </button>

                  {/* Paid Live Monthly Option */}
                  <button
                    type="button"
                    onClick={() => onCreateLive(sendCredentialsEmail)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all text-left group relative cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-primary font-semibold">Live Account</h3>
                        <span className="text-xs font-mono font-bold text-primary">
                          ${price.toFixed(2)}/mo
                        </span>
                      </div>
                      <p className="text-primary/60 text-xs">
                        No simulation notice • 30-day cycle • Paid via wallet
                      </p>
                    </div>
                  </button>
                </div>

                <div className="pt-2 text-center space-y-4">
                  <div className="flex items-center justify-between px-1 text-xs text-white/45">
                    <span>Crypto wallet balance</span>
                    <span className="font-mono text-white/80 font-medium">
                      ${walletBalance.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/25 leading-tight px-4 italic">
                    By creating this account, you agree that we are not responsible for how it is used.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="w-full py-3 rounded-xl border border-white/5 bg-white/2 text-white/40 hover:text-white/80 hover:bg-white/5 font-medium transition-all active:scale-95 text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface SubscriptionBillingDialogProps {
  mode: "upgrade" | "renew";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  price: number;
  walletBalance: number;
  accountEmail?: string;
  error?: string | null;
}

export function SubscriptionBillingDialog({
  mode,
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  price,
  walletBalance,
  accountEmail,
  error,
}: SubscriptionBillingDialogProps) {
  const insufficient = walletBalance < price;
  const isRenew = mode === "renew";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none"
        showCloseButton={false}
        noShadow
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden space-y-6"
        >
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isRenew ? "Renew Monthly Subscription" : "Activate Live Account"}
            </h2>
            <p className="text-white/45 text-sm">
              {isRenew
                ? "Add 30 more days of live access with no simulation notice on Fernway."
                : "Remove the simulation notice from Fernway for 30 days. We'll remind you before renewal."}
            </p>
            {accountEmail && (
              <p className="text-xs font-mono text-primary pt-1">{accountEmail}</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                {isRenew ? "Monthly Renewal (30 days)" : "Monthly Live Plan (30 days)"}
              </span>
              <span className="font-mono text-base font-bold text-primary">
                ${price.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/45 border-t border-white/10 pt-2">
              <span>Crypto Wallet Balance</span>
              <span className="font-mono text-white/80 font-medium">
                ${walletBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {(error || insufficient) && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
              <p className="text-red-400 text-sm font-medium leading-relaxed">
                {error || `Insufficient wallet balance. Required: $${price.toFixed(2)}.`}
              </p>
              <Link
                to="/wallet"
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-600/60 hover:bg-green-600/80 text-white rounded-lg transition-all font-bold text-sm"
              >
                <Wallet className="w-4 h-4" />
                Fund Wallet with Crypto
              </Link>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="button"
              disabled={isSubmitting || insufficient}
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isRenew ? <RefreshCw className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
              {isSubmitting
                ? "Processing..."
                : isRenew
                  ? `Pay $${price.toFixed(2)} & Renew 30 Days`
                  : `Pay $${price.toFixed(2)} & Go Live`}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl border border-white/5 bg-white/2 text-white/40 hover:text-white/80 hover:bg-white/5 font-medium transition-all active:scale-95 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

interface SendCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  accountEmail: string;
  accountHolder: string;
  portalUrl: string;
  lastSentAt?: string | null;
}

export function SendCredentialsDialog({
  open,
  onOpenChange,
  onConfirm,
  isSubmitting,
  accountEmail,
  accountHolder,
  portalUrl,
  lastSentAt,
}: SendCredentialsDialogProps) {
  const isResend = Boolean(lastSentAt);
  const formattedLastSent = lastSentAt
    ? new Date(lastSentAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none"
        showCloseButton={false}
        noShadow
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden space-y-6"
        >
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
              <Mail className="size-3" />
              {isResend ? "Resend Sign-In Email" : "Email Sign-In Details"}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight pt-1">
              {isResend ? "Resend account login details?" : "Send login details by email?"}
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              We&apos;ll send a Fernway-branded email directly to the recipient&apos;s inbox so you don&apos;t have to paste credentials in DMs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-white/45">Recipient</span>
              <span className="font-mono text-emerald-300 truncate">{accountEmail}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
              <span className="text-white/45">Account Holder</span>
              <span className="text-white font-medium truncate">{accountHolder}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
              <span className="text-white/45">Portal Link</span>
              <span className="font-mono text-white/80 truncate">{portalUrl}/sign-in</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
              <span className="text-white/45">Included</span>
              <span className="text-white/80">Portal link, email, password &amp; PIN</span>
            </div>
            {formattedLastSent && (
              <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                <span className="text-white/45">Last Sent</span>
                <span className="text-white/65">{formattedLastSent}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirm}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isResend ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {isSubmitting
                ? "Sending email..."
                : isResend
                  ? "Resend Login Email"
                  : "Send Login Details Email"}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl border border-white/5 bg-white/2 text-white/40 hover:text-white/80 hover:bg-white/5 font-medium transition-all active:scale-95 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
