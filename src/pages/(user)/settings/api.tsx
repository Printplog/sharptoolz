import { type ComponentProps, type ReactNode, forwardRef, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Clipboard,
  Code2,
  Globe2,
  KeyRound,
  LockKeyhole,
  Palette,
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";

import {
  activateApiAccess,
  createApiKey,
  deleteApiKey,
  getApiAccessStatus,
  rotateApiKey,
  updateApiConfiguration,
} from "@/api/apiEndpoints";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_API_THEME } from "@/lib/apiTheme";
import { correctWebsiteInput, normalizeWebsiteOrigin } from "@/lib/utils/normalizeWebsiteOrigin";
import type { ApiKeyRecord, ApiTheme } from "@/types";

const EMBED_SNIPPET = `<!-- Keep your stz_live key on your backend. -->
<script src="https://sharptoolz.com/embed/v1.js"></script>
<div id="document-form"></div>
<script>
  // embedUrl came from POST /api/v1/embed-sessions on your backend.
  SharpToolz.mount("#document-form", {
    embedUrl,
    autoResize: true,
    loading: {
      text: "Preparing your document…",
      logoUrl: "/your-logo.svg",
      backgroundColor: "#ffffff",
      textColor: "#17362f",
      accentColor: "#176b5b"
    },
    onComplete: ({ documentId }) => console.log(documentId)
  });
</script>`;

function apiError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string; wallet?: string; non_field_errors?: string[] } } }).response;
    return response?.data?.detail || response?.data?.wallet || response?.data?.non_field_errors?.[0] || fallback;
  }
  return fallback;
}

function ApiDocsLink() {
  return (
    <Button asChild variant="outline" size="sm" className="border-white/15 bg-transparent">
      <a href="https://developer.sharptoolz.com">Docs <Code2 className="size-3.5" /></a>
    </Button>
  );
}

function ApiPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-content mx-auto max-w-5xl space-y-8 pb-16">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="text-white/60">
            <Link to="/settings" aria-label="Back to settings"><ArrowLeft /></Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-white">API</h1>
            <p className="mt-0.5 text-sm text-white/45">Connect SharpToolz to your product.</p>
          </div>
        </div>
        <ApiDocsLink />
      </header>
      {children}
    </div>
  );
}

const SettingsRow = forwardRef<HTMLButtonElement, {
  icon: ReactNode;
  title: string;
  detail: string;
  children?: ReactNode;
} & ComponentProps<"button">>(function SettingsRow({ icon, title, detail, children, className, ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={`flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${className || ""}`}
      {...props}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/50">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-white/40">{detail}</span>
      </span>
      {children}
      <ChevronRight className="size-4 shrink-0 text-white/20" />
    </button>
  );
});

export default function ApiSettingsRoute() {
  const location = useLocation();
  if (location.pathname !== "/settings/api") return <Outlet />;
  return <ApiSettingsPage />;
}

function ApiSettingsPage() {
  const queryClient = useQueryClient();
  const [origins, setOrigins] = useState<string[]>([]);
  const [originDraft, setOriginDraft] = useState("");
  const [theme, setTheme] = useState<ApiTheme>(DEFAULT_API_THEME);
  const [keyName, setKeyName] = useState("Production");
  const [newKey, setNewKey] = useState<ApiKeyRecord | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["api-access"],
    queryFn: getApiAccessStatus,
  });

  useEffect(() => {
    if (!data) return;
    setOrigins(data.configuration.allowed_origins);
    setTheme({ ...DEFAULT_API_THEME, ...data.configuration.theme });
  }, [data]);

  const activate = useMutation({
    mutationFn: activateApiAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-access"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("API access activated.");
    },
    onError: (error) => toast.error(apiError(error, "Could not activate API access.")),
  });

  const saveConfiguration = useMutation({
    mutationFn: (allowedOrigins: string[]) => updateApiConfiguration({ allowed_origins: allowedOrigins, theme }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-access"] });
      toast.success("API configuration saved.");
    },
    onError: (error) => toast.error(apiError(error, "Could not save API configuration.")),
  });

  const createKeyMutation = useMutation({
    mutationFn: () => createApiKey({ name: keyName.trim(), allowed_origins: origins }),
    onSuccess: (key) => {
      setNewKey(key);
      setKeyName("Production");
      queryClient.invalidateQueries({ queryKey: ["api-access"] });
      toast.success("API key created. Copy it now.");
    },
    onError: (error) => toast.error(apiError(error, "Could not create API key.")),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-access"] });
      toast.success("API key deleted.");
    },
    onError: (error) => toast.error(apiError(error, "Could not delete API key.")),
  });

  const rotateKeyMutation = useMutation({
    mutationFn: rotateApiKey,
    onSuccess: (key) => {
      setNewKey(key);
      queryClient.invalidateQueries({ queryKey: ["api-access"] });
      toast.success("API key rotated. Copy the replacement now.");
    },
    onError: (error) => toast.error(apiError(error, "Could not rotate API key.")),
  });

  const copySecret = async () => {
    if (!newKey?.secret) return;
    try {
      await navigator.clipboard.writeText(newKey.secret);
      toast.success("API key copied.");
    } catch {
      toast.error("Clipboard access was blocked. Select and copy the key manually.");
    }
  };

  const copyEmbedSnippet = async () => {
    try {
      await navigator.clipboard.writeText(EMBED_SNIPPET);
      toast.success("Embed code copied.");
    } catch {
      toast.error("Clipboard access was blocked. Select and copy the code manually.");
    }
  };

  const addOrigin = () => {
    try {
      const normalized = normalizeWebsiteOrigin(originDraft);
      setOrigins((current) => current.includes(normalized) ? current : [...current, normalized]);
      setOriginDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enter a valid website.");
    }
  };

  const saveWebsites = () => {
    if (!originDraft.trim()) {
      saveConfiguration.mutate(origins);
      return;
    }

    try {
      const normalized = normalizeWebsiteOrigin(originDraft);
      const nextOrigins = origins.includes(normalized) ? origins : [...origins, normalized];
      setOrigins(nextOrigins);
      setOriginDraft("");
      saveConfiguration.mutate(nextOrigins);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enter a valid website.");
    }
  };

  if (isLoading) {
    return (
      <ApiPageShell>
        <div className="space-y-3 animate-pulse">
          <div className="h-24 rounded-2xl bg-white/[0.03]" />
          <div className="h-64 rounded-2xl bg-white/[0.03]" />
        </div>
      </ApiPageShell>
    );
  }

  if (isError || !data) {
    return (
      <ApiPageShell>
        <Card className="border-red-400/20 bg-red-500/[0.04]">
          <CardContent className="flex items-start gap-4 p-6">
            <LockKeyhole className="mt-0.5 size-5 text-red-300" />
            <div>
              <h2 className="font-medium text-white">API settings could not be loaded</h2>
              <p className="mt-1 text-sm text-white/45">Refresh the page or try again shortly.</p>
            </div>
          </CardContent>
        </Card>
      </ApiPageShell>
    );
  }

  if (!data.enabled) {
    return (
      <ApiPageShell>
        <Card className="border-white/10 bg-white/[0.025]">
          <CardContent className="flex items-start gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5"><LockKeyhole className="size-5 text-white/40" /></span>
            <div>
              <h2 className="font-medium text-white">API access is currently closed</h2>
              <p className="mt-1 text-sm leading-6 text-white/45">New API access and existing keys have been disabled by the SharpToolz administrator.</p>
            </div>
          </CardContent>
        </Card>
      </ApiPageShell>
    );
  }

  if (!data.entitlement) {
    const price = Number(data.upgrade_price);
    const toolDiscount = Number(data.tool_discount_percentage);
    const needsFunding = data.upgrade_required && Number(data.wallet_spendable_balance) < price;
    return (
      <ApiPageShell>
        <Card className="border-white/10 bg-white/[0.025]">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Code2 className="size-5 text-primary" /></span>
              <div>
                <h2 className="font-medium text-white">Activate API access</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-white/45">
                  {data.upgrade_required && price > 0
                    ? `Pay a one-time $${price.toFixed(2)} upgrade from your SharpToolz wallet.`
                    : "API activation is currently free."}
                </p>
                {toolDiscount > 0 ? (
                  <p className="mt-2 text-xs text-primary">Includes {toolDiscount.toLocaleString(undefined, { maximumFractionDigits: 2 })}% off every paid API document.</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-4">
              <div className="flex items-center gap-2 text-sm text-white/55"><Wallet className="size-4" /> Wallet balance</div>
              <span className="font-mono text-sm text-white">${Number(data.wallet_spendable_balance).toFixed(2)}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => activate.mutate()} loading={activate.isPending} disabled={activate.isPending}>
                {data.upgrade_required && price > 0 ? `Pay $${price.toFixed(2)} and activate` : "Activate API access"}
              </Button>
              {needsFunding ? (
                <Button asChild variant="outline"><Link to="/wallet">Fund wallet</Link></Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </ApiPageShell>
    );
  }

  if (data.entitlement.status !== "active") {
    return (
      <ApiPageShell>
        <Card className="border-red-400/20 bg-red-500/[0.04]">
          <CardContent className="flex items-start gap-4 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10"><LockKeyhole className="size-5 text-red-300" /></span>
            <div>
              <h2 className="font-medium capitalize text-white">API access {data.entitlement.status}</h2>
              <p className="mt-1 text-sm leading-6 text-white/45">Keys and pending hosted forms are disabled. Contact SharpToolz support to restore access.</p>
            </div>
          </CardContent>
        </Card>
      </ApiPageShell>
    );
  }

  const activeKeyCount = data.keys.filter((key) => key.active).length;
  const toolDiscount = Number(data.tool_discount_percentage);
  return (
    <ApiPageShell>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10"><Code2 className="size-5 text-primary" /></span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-medium text-white">API access</h2>
              <Badge className="rounded-full border-primary/20 bg-primary/10 px-2 text-[11px] text-primary">Active</Badge>
            </div>
            <p className="mt-1 text-xs text-white/40">
              {data.rate_limit_per_minute} requests/min · {data.session_ttl_minutes}-minute sessions
              {toolDiscount > 0 ? ` · ${toolDiscount.toLocaleString(undefined, { maximumFractionDigits: 2 })}% tool discount` : ""}
            </p>
          </div>
        </div>
        <ShieldCheck className="size-5 text-white/20" />
      </section>

      <section aria-labelledby="api-setup-heading" className="space-y-3">
        <h2 id="api-setup-heading" className="px-1 text-xs font-semibold text-white/30">Setup</h2>
        <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.015]">
          <Dialog>
            <DialogTrigger asChild>
              <SettingsRow icon={<Globe2 className="size-5" />} title="Allowed websites" detail={origins.length ? `${origins.length} ${origins.length === 1 ? "website" : "websites"}` : "Add the website that will host your form"} />
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Allowed websites</DialogTitle>
                <DialogDescription>Add websites one at a time. Trailing slashes, paths, and missing protocols are cleaned automatically.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Label htmlFor="allowed-website">Website</Label>
                <div className="flex gap-2">
                  <Input
                    id="allowed-website"
                    value={originDraft}
                    onChange={(event) => setOriginDraft(correctWebsiteInput(event.target.value))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addOrigin();
                      }
                    }}
                    placeholder="app.example.com"
                    className="rounded-xl border-white/10 bg-white/5 font-mono text-sm"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <Button type="button" variant="outline" onClick={addOrigin} disabled={!originDraft.trim()}><Plus /> Add</Button>
                </div>
                <p className="text-xs text-white/35">We add https:// when missing and remove the final / automatically.</p>
              </div>

              <div className="max-h-52 space-y-2 overflow-y-auto">
                {origins.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-white/35">No websites added yet.</p> : null}
                {origins.map((origin) => (
                  <div key={origin} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5">
                    <Globe2 className="size-4 shrink-0 text-primary/70" />
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/70">{origin}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-white/35 hover:text-red-300"
                      onClick={() => setOrigins((current) => current.filter((value) => value !== origin))}
                      aria-label={`Remove ${origin}`}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Close</Button></DialogClose>
                <Button onClick={saveWebsites} loading={saveConfiguration.isPending} disabled={saveConfiguration.isPending}><Save /> Save websites</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <SettingsRow icon={<KeyRound className="size-5" />} title="API keys" detail={activeKeyCount ? `${activeKeyCount} active ${activeKeyCount === 1 ? "key" : "keys"}` : "Create your first server key"} />
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>API keys</DialogTitle>
                <DialogDescription>Keys belong on your backend. Rotate a key to replace its secret without changing its settings.</DialogDescription>
              </DialogHeader>

              {newKey?.secret ? (
                <div className="space-y-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.04] p-4">
                  <div>
                    <p className="text-sm font-medium text-amber-100">Copy this key now</p>
                    <p className="mt-1 text-xs text-amber-100/50">{newKey.warning || "It cannot be recovered later."}</p>
                  </div>
                  <div className="flex gap-2">
                    <Input readOnly value={newKey.secret} className="rounded-xl border-amber-300/15 bg-black/20 font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={copySecret} aria-label="Copy API key"><Clipboard /></Button>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setNewKey(null)}>I saved it</Button>
                </div>
              ) : null}

              <div className="space-y-3 rounded-xl border border-white/10 p-4">
                <Label htmlFor="api-key-name">New key name</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input id="api-key-name" value={keyName} onChange={(event) => setKeyName(event.target.value)} className="rounded-xl border-white/10 bg-white/5" />
                  <Button
                    type="button"
                    onClick={() => createKeyMutation.mutate()}
                    loading={createKeyMutation.isPending}
                    disabled={!keyName.trim() || origins.length === 0 || createKeyMutation.isPending}
                  >
                    <Plus /> Create key
                  </Button>
                </div>
                {origins.length === 0 ? <p className="text-xs text-amber-200/60">Add an allowed website before creating a key.</p> : null}
              </div>

              <div className="divide-y divide-white/10">
                {data.keys.length === 0 ? <p className="py-5 text-sm text-white/40">No keys created yet.</p> : null}
                {data.keys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{key.name}</p>
                      <p className="mt-1 font-mono text-xs text-white/35">{key.prefix}•••••••• · {key.active ? "active" : "revoked"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                    {key.active ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={rotateKeyMutation.isPending}
                        disabled={rotateKeyMutation.isPending || deleteKeyMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Rotate ${key.name}? The current server key will stop working immediately.`)) {
                            rotateKeyMutation.mutate(key.id);
                          }
                        }}
                      >
                        <RotateCcw /> Rotate
                      </Button>
                    ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-300 hover:text-red-200"
                        loading={deleteKeyMutation.isPending}
                        disabled={rotateKeyMutation.isPending || deleteKeyMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`Delete ${key.name}? This permanently removes the key and stops its pending hosted forms.`)) {
                            deleteKeyMutation.mutate(key.id);
                          }
                        }}
                      >
                        <Trash2 /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Link
            to="/settings/api/appearance"
            className="flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-white/50">
              <Palette className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-white">Form appearance</span>
              <span className="mt-0.5 block truncate text-xs text-white/40">{theme.appearance === "dark" ? "Dark" : "Light"} · {theme.fontFamily}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-white/20" />
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <SettingsRow icon={<Code2 className="size-5" />} title="Embed code" detail="Add the hosted form to your website" />
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Embed code</DialogTitle>
                <DialogDescription>Your backend creates a short-lived session. The browser loads only the returned embed URL.</DialogDescription>
              </DialogHeader>
              <pre className="max-h-80 overflow-auto rounded-xl bg-black/40 p-4 text-xs leading-6 text-primary/80"><code>{EMBED_SNIPPET}</code></pre>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={copyEmbedSnippet}><Clipboard /> Copy code</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <div className="flex items-start gap-3 rounded-xl bg-white/[0.02] py-3 pl-4 pr-20 text-xs leading-5 text-white/35 sm:pr-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary/60" />
        <p>Keep API keys on your backend. End users receive only a short-lived form session scoped to one document.</p>
      </div>
    </ApiPageShell>
  );
}
