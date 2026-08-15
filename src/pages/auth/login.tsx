import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  isTwoFactorChallenge,
  type AdminTwoFactorSetup,
  type AuthDialogProps,
  type LoginPayload,
  type LoginResponse,
  type TwoFactorChallenge,
  type User as UserType,
} from "@/types";
import {
  login,
  loginWithGoogle,
  setupAdminTwoFactor,
  verifyAdminTwoFactor,
} from "@/api/apiEndpoints";
import { toast } from "sonner";
import errorMessage from "@/lib/utils/errorMessage";
import { useAuthStore } from "@/store/authStore";
import { useDialogStore } from "@/store/dialogStore";
import { useState } from "react";
import { isAdminOrStaff } from "@/lib/constants/roles";
import { ArrowLeft, Check, Copy, Eye, EyeOff, KeyRound, Lock, ShieldCheck, User, UserPlus } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { QRCodeSVG } from "qrcode.react";

const loginSchema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function Login({ dialog = false }: AuthDialogProps) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<TwoFactorChallenge | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<AdminTwoFactorSetup | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const { closeDialog } = useDialogStore();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const finishLogin = (user: UserType) => {
    toast.success("Login Success");
    setUser(user);

    if (dialog) {
      closeDialog("register");
      return;
    }

    navigate(isAdminOrStaff(user.role) ? "/admin/dashboard" : next);
  };

  const setupMutation = useMutation({
    mutationFn: setupAdminTwoFactor,
    onSuccess: setTwoFactorSetup,
    onError: (error: Error) => toast.error(errorMessage(error)),
  });

  const beginTwoFactor = (challenge: TwoFactorChallenge) => {
    setTwoFactorChallenge(challenge);
    setTwoFactorSetup(null);
    setTwoFactorCode("");
    if (challenge.setup_required) setupMutation.mutate();
  };

  const handleLoginResponse = (response: LoginResponse) => {
    if (isTwoFactorChallenge(response)) {
      beginTwoFactor(response);
      return;
    }
    finishLogin(response);
  };

  const verifyMutation = useMutation({
    mutationFn: verifyAdminTwoFactor,
    onSuccess: (user) => {
      setUser(user);
      if (user.recovery_codes?.length) {
        setRecoveryCodes(user.recovery_codes);
        return;
      }
      finishLogin(user);
    },
    onError: (error: Error) => toast.error(errorMessage(error)),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: LoginPayload) => login(data),
    onSuccess: handleLoginResponse,
    onError: (error: Error) => {
      toast.error(errorMessage(error));
    },
  });

  const { mutate: googleMutate, isPending: googlePending } = useMutation({
    mutationFn: (access_token: string) => loginWithGoogle(access_token),
    onSuccess: handleLoginResponse,
    onError: (error: Error) => {
      const msg = errorMessage(error as Parameters<typeof errorMessage>[0]);
      toast.error(typeof msg === "string" && msg.startsWith("<") ? "Google sign-in failed. Please try again." : msg);
    },
  });

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google-callback`;
    const url =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&prompt=select_account`;

    const popup = window.open(url, "google-auth", "width=500,height=600,scrollbars=yes,resizable=yes");
    if (!popup) {
      toast.error("Popup blocked — please allow popups for this site.");
      return;
    }

    const channel = new BroadcastChannel("google_auth");

    // Close channel if user dismisses the popup without completing sign-in
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        channel.close();
      }
    }, 500);

    channel.onmessage = (event) => {
      clearInterval(pollTimer);
      channel.close();
      if (event.data?.type !== "GOOGLE_AUTH") return;
      if (event.data.error || !event.data.access_token) {
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      googleMutate(event.data.access_token);
    };
  };

  const onSubmitLogin = async (values: LoginSchema) => {
    mutate(values);
  };

  const copyRecoveryCodes = async () => {
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (recoveryCodes.length) {
    return (
      <div className="space-y-6">
        <div className="flex size-12 items-center justify-center rounded-full border border-[#cee88c]/20 bg-[#cee88c]/10 text-[#cee88c]">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight">Save your recovery codes</h2>
          <p className="text-sm leading-6 text-white/45">
            Each code works once if you lose access to your authenticator. Store them somewhere private.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-4 font-mono text-sm text-white/75">
          {recoveryCodes.map((code) => <span key={code}>{code}</span>)}
        </div>
        <Button type="button" variant="outline" className="h-11 w-full" onClick={copyRecoveryCodes}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Copied" : "Copy recovery codes"}
        </Button>
        <Button type="button" className="h-12 w-full bg-[#cee88c] font-bold text-black hover:bg-[#cee88c]/90" onClick={() => finishLogin(useAuthStore.getState().user!)}>
          Continue to admin
        </Button>
      </div>
    );
  }

  if (twoFactorChallenge) {
    const isSetup = twoFactorChallenge.setup_required;
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setTwoFactorChallenge(null);
            setTwoFactorSetup(null);
            setTwoFactorCode("");
          }}
          className="inline-flex items-center gap-2 text-xs text-white/35 transition hover:text-white"
        >
          <ArrowLeft className="size-3.5" /> Use another account
        </button>

        <div className="space-y-2">
          <div className="flex size-12 items-center justify-center rounded-full border border-[#cee88c]/20 bg-[#cee88c]/10 text-[#cee88c]">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="pt-2 text-2xl font-black tracking-tight">
            {isSetup ? "Protect your admin account" : "Admin verification"}
          </h2>
          <p className="text-sm leading-6 text-white/45">
            {isSetup
              ? "Scan this code with Google Authenticator, Authy, 1Password, or another authenticator app."
              : "Enter the current code from your authenticator app, or use a recovery code."}
          </p>
        </div>

        {isSetup && (
          <div className="space-y-3">
            {setupMutation.isPending && (
              <div className="flex h-44 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/35">
                Preparing secure setup…
              </div>
            )}
            {twoFactorSetup && (
              <>
                <div className="mx-auto w-fit rounded-2xl bg-white p-3">
                  <QRCodeSVG value={twoFactorSetup.provisioning_uri} size={156} level="M" />
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Manual setup key</p>
                  <code className="break-all text-xs text-white/70">{twoFactorSetup.manual_key}</code>
                </div>
              </>
            )}
          </div>
        )}

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            verifyMutation.mutate(twoFactorCode);
          }}
        >
          <div className="space-y-2">
            <label htmlFor="admin-two-factor-code" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Authenticator or recovery code
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/20" />
              <Input
                id="admin-two-factor-code"
                autoFocus
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value.toUpperCase().replace(/\s/g, ""))}
                placeholder="000000"
                className="h-12 border-white/10 bg-white/[0.03] pl-11 text-center font-mono tracking-[0.25em]"
              />
            </div>
          </div>
          <Button
            type="submit"
            className="h-12 w-full bg-[#cee88c] font-bold text-black hover:bg-[#cee88c]/90"
            disabled={!twoFactorCode || verifyMutation.isPending || (isSetup && !twoFactorSetup)}
          >
            {verifyMutation.isPending ? "Verifying…" : isSetup ? "Enable and continue" : "Verify and continue"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">
          Sign <span className="text-[#cee88c]">In</span>
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitLogin)} className="space-y-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                  Username or Email
                </FormLabel>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                  <FormControl>
                    <Input
                      placeholder="username@example.com"
                      {...field}
                      className="border-white/5 bg-white/[0.02] pl-11 h-12 rounded-full placeholder:text-white/10 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/5 transition-all"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
                  Password
                </FormLabel>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      {...field}
                      className="border-white/5 bg-white/[0.02] pl-11 pr-11 h-12 rounded-full placeholder:text-white/10 focus-visible:border-[#cee88c]/30 focus-visible:ring-[#cee88c]/5 transition-all"
                    />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-1">
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-white/30 hover:text-[#cee88c] transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              type="submit"
              className="flex-1 h-12 bg-[#cee88c] text-black font-bold text-sm rounded-full hover:bg-[#cee88c]/90 border border-white/20 transition-all active:scale-[0.98]"
              disabled={isPending}
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={googlePending}
              className="w-12 h-12 rounded-full border border-white/20 bg-white/5 p-0 flex items-center justify-center hover:bg-white/10 transition-all shrink-0"
              title="Sign in with Google"
            >
              {googlePending ? (
                <svg className="w-4 h-4 animate-spin text-white/60" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
            </Button>
          </div>

          {!dialog && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 pt-4">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                <span className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">Or</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>
              <div className="text-center">
                <PremiumButton 
                  text="New? Create Account"
                  icon={UserPlus}
                  href="/auth/register"
                  variant="outline"
                  className="w-full h-12 text-xs font-bold bg-white/5 border border-white/20 hover:bg-white/10"
                  noShadow={true}
                />
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
