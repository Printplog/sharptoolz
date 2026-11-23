import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  Upload,
  User as UserIcon,
} from "lucide-react";
import {
  approveAdminFernwayTransfer,
  approveFernwayTransfer,
  confirmFernwayEmailVerification,
  createAdminFernwayTransaction,
  createFernwayAccount,
  createFernwayAccountTransaction,
  declineAdminFernwayTransfer,
  declineFernwayTransfer,
  deleteAdminFernwayTransaction,
  deleteFernwayAccountTransaction,
  getAdminFernwayAccountById,
  getFernwayAccountById,
  getFernwayProfile,
  getTrackingSupportMessages,
  renewFernwayAccount,
  requestFernwayEmailVerification,
  sendAdminFernwayCredentialsEmail,
  sendFernwayCredentialsEmail,
  updateAdminFernwayAccount,
  updateAdminFernwaySubscription,
  updateFernwayAccountById,
  upgradeFernwayAccountById,
  type FernwayEmailVerificationChallenge,
  type FernwayEmailVerificationGrant,
} from "@/api/apiEndpoints";
import SvgFormTranslatorSkeleton from "@/components/Dashboard/SVGFormTranslator/SvgFormTranslatorSkeleton";
import { VerifyAccountEmailBanner } from "@/components/Dashboard/VerifyAccountEmailBanner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import {
  CreateAccountDialog,
  SendCredentialsDialog,
  SubscriptionBillingDialog,
} from "./FernwayAccountDialogs";
import { FernwayLaunchMenu } from "./FernwayLaunchMenu";
import { FernwayPreviewPanel } from "./FernwayPreviewPanel";
import { FernwaySupportMessages } from "./FernwaySupportMessages";
import { PinBoxesInput } from "./PinBoxesInput";
import {
  FernwayTransactionsTab,
  type NewFernwayTransactionInput,
} from "./FernwayTransactionsTab";
import {
  FERNWAY_GREEN_THEME,
  formatCardExpiry,
  formatCardNumber,
  generateAccountNumber,
  generateCardNumber,
  generateCvv,
  generateTransactionPin,
  normalizeDollarString,
  useFernwayAppBaseUrl,
  type FernwayFormState,
} from "./themes";

const BALANCE_PRESETS = [
  { label: "$250K", balance: "250000.00" },
  { label: "$1M", balance: "1000000.00" },
  { label: "$5M", balance: "5000000.00" },
];

function generateRandomPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

function formatExpiryDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface FernwayEditorProps {
  /** When set, edits an existing created banking account; when omitted, creates a brand-new account. */
  profileId?: string;
  /** When true, uses SharpToolz Admin endpoints and displays admin subscription & owner controls. */
  adminMode?: boolean;
}

export function FernwayEditor({ profileId, adminMode = false }: FernwayEditorProps) {
  const isEditingExisting = Boolean(profileId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const detailQueryKey = adminMode
    ? ["admin-fernway-account", profileId]
    : isEditingExisting
      ? ["fernway-account", profileId]
      : ["fernway-new-defaults"];

  const requestedTab = searchParams.get("tab");
  const initialTab =
    isEditingExisting && (requestedTab === "transactions" || requestedTab === "support")
      ? requestedTab
      : "editor";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendCredentialsModal, setShowSendCredentialsModal] = useState(false);
  const [billingModalMode, setBillingModalMode] = useState<"upgrade" | "renew" | null>(null);
  const [creationError, setCreationError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [reviewingTxId, setReviewingTxId] = useState<string | null>(null);
  const [emailChallenge, setEmailChallenge] = useState<FernwayEmailVerificationChallenge | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [emailGrant, setEmailGrant] = useState<FernwayEmailVerificationGrant | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isConfirmingCode, setIsConfirmingCode] = useState(false);
  const [ownerVerifiedOverride, setOwnerVerifiedOverride] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const fernwayHomeUrl = useFernwayAppBaseUrl();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isEditingExisting && (tab === "transactions" || tab === "support" || tab === "preview" || tab === "editor")) {
      setActiveTab(tab);
    }
  }, [isEditingExisting, searchParams]);

  const [form, setForm] = useState<FernwayFormState>({
    first_name: "Alexander",
    last_name: "Hamilton",
    email: "",
    password: "password123",
    transaction_pin: "1234",
    theme: FERNWAY_GREEN_THEME.id,
    account_balance: "250000.00",
    account_number: generateAccountNumber(),
    routing_number: "021000021",
    card_holder_name: "Alexander Hamilton",
    card_number: "4532 9182 7364 8892",
    card_expiry: "12/28",
    card_cvv: "721",
    card_pin: "1234",
    card_limit: "50000.00",
    card_is_frozen: false,
  });

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => {
      if (profileId) {
        return adminMode ? getAdminFernwayAccountById(profileId) : getFernwayAccountById(profileId);
      }
      return getFernwayProfile();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: supportData } = useQuery({
    queryKey: ["support-messages", { fernwayProfileId: profileId }],
    queryFn: () => getTrackingSupportMessages({ fernway_profile_id: profileId }),
    enabled: Boolean(profileId),
    staleTime: 30 * 1000,
  });
  const unreadSupportCount = supportData?.unread_count ?? 0;

  useEffect(() => {
    if (!profile) return;
    const totalCents =
      profile.accounts && profile.accounts.length > 0
        ? profile.accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
        : 25000000;
    const primaryAccount = profile.accounts?.[0];
    const card = profile.cards?.[0];

    setForm((prev) => ({
      ...prev,
      first_name: profile.first_name || prev.first_name,
      last_name: profile.last_name || prev.last_name,
      email: profile.is_created ? (profile.email || prev.email) : prev.email,
      password: profile.password || prev.password,
      transaction_pin: profile.transaction_pin || prev.transaction_pin || "1234",
      theme: FERNWAY_GREEN_THEME.id,
      account_balance: (totalCents / 100).toFixed(2),
      account_number: primaryAccount?.account_number || prev.account_number,
      routing_number: primaryAccount?.routing_number || prev.routing_number || "021000021",
      card_holder_name:
        card?.holder_name ||
        `${profile.first_name} ${profile.last_name}`.trim() ||
        prev.card_holder_name,
      card_number: card?.card_number
        ? formatCardNumber(card.card_number)
        : card?.last4
          ? `4532 9182 7364 ${card.last4}`
          : prev.card_number,
      card_expiry: card?.expiry || prev.card_expiry,
      card_cvv: card?.cvv || prev.card_cvv,
      card_pin: card?.pin || prev.card_pin || "1234",
      card_limit: card ? (card.monthly_limit / 100).toFixed(2) : prev.card_limit,
      card_is_frozen: card?.is_frozen ?? prev.card_is_frozen,
    }));
  }, [profile]);

  const normalizedEmail = form.email.trim().toLowerCase();
  const savedProfileEmail = (profile?.email || "").trim().toLowerCase();
  const isProfileCreated = Boolean(profile?.is_created);
  const isAlreadyVerifiedOnProfile = Boolean(
    isProfileCreated && profile?.email_verified && normalizedEmail && normalizedEmail === savedProfileEmail
  );
  const hasMatchingEmailGrant = Boolean(
    emailGrant && emailGrant.email.trim().toLowerCase() === normalizedEmail
  );
  const isEmailVerified = isAlreadyVerifiedOnProfile || hasMatchingEmailGrant;
  const emailChangedFromSaved = Boolean(isProfileCreated && normalizedEmail !== savedProfileEmail);
  const isOwnerEmailVerified = Boolean(
    adminMode || ownerVerifiedOverride || profile?.owner_email_verified || authUser?.email_verified
  );
  const ownerEmailAddress = profile?.owner_email || authUser?.email || "";

  const handleRequestEmailCode = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address first.");
      return;
    }
    setIsSendingCode(true);
    try {
      const challenge = await requestFernwayEmailVerification({
        email,
        profile_id: profileId || null,
      });
      setEmailChallenge(challenge);
      setEmailCode("");
      toast.success(`4-digit verification code sent to ${challenge.email_hint}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not send verification code. Try again.";
      toast.error(msg);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmEmailCode = async () => {
    if (!emailChallenge || emailCode.length !== 4) {
      toast.error("Enter the 4-digit code from your inbox.");
      return;
    }
    setIsConfirmingCode(true);
    try {
      const grant = await confirmFernwayEmailVerification({
        challenge_id: emailChallenge.challenge_id,
        code: emailCode,
      });
      setEmailGrant(grant);
      setEmailChallenge(null);
      setEmailCode("");

      if (isProfileCreated && profileId && !emailChangedFromSaved) {
        const updated = adminMode
          ? await updateAdminFernwayAccount(profileId, {
              email: grant.email,
              email_verification_token: grant.verification_token,
            })
          : await updateFernwayAccountById(profileId, {
              email: grant.email,
              email_verification_token: grant.verification_token,
            });
        queryClient.setQueryData(detailQueryKey, updated);
        queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
        toast.success("Email verified — Lindenway notifications are now active!");
      } else {
        toast.success("Email verified! You can now save or create this account.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Verification code is invalid or expired.";
      toast.error(msg);
    } finally {
      setIsConfirmingCode(false);
    }
  };

  const validateCredentials = (): boolean => {
    const email = form.email.trim();
    const password = form.password.trim();
    const cardDigits = form.card_number.replace(/\D/g, "");
    const cvvDigits = form.card_cvv.replace(/\D/g, "");
    if (!isProfileCreated && !isOwnerEmailVerified) {
      toast.error("Verify your SharpToolz account email first so you can receive notifications.");
      return false;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid sign-in email before continuing.");
      return false;
    }
    if (password.length < 4) {
      toast.error("Please enter a sign-in password (at least 4 characters).");
      return false;
    }
    if (!/^\d{4}$/.test(form.transaction_pin.trim())) {
      toast.error("Transaction PIN must be exactly 4 digits.");
      return false;
    }
    const acctDigits = form.account_number.replace(/\D/g, "");
    const routingDigits = form.routing_number.replace(/\D/g, "");
    if (acctDigits.length < 6) {
      toast.error("Account number must be at least 6 digits.");
      return false;
    }
    if (routingDigits.length < 6) {
      toast.error("Routing number must be at least 6 digits.");
      return false;
    }
    if (cardDigits.length !== 16) {
      toast.error("Card number must be 16 digits.");
      return false;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.card_expiry.trim())) {
      toast.error("Card expiry must be in MM/YY format (e.g. 12/28).");
      return false;
    }
    if (cvvDigits.length < 3 || cvvDigits.length > 4) {
      toast.error("CVV must be 3 or 4 digits.");
      return false;
    }
    if (!/^\d{4}$/.test(form.card_pin.trim())) {
      toast.error("Card PIN must be exactly 4 digits.");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const formattedNumber = formatCardNumber(form.card_number) || "4532 9182 7364 8892";
    const digits = formattedNumber.replace(/\D/g, "");
    return {
      first_name: form.first_name.trim() || "Alexander",
      last_name: form.last_name.trim() || "Hamilton",
      email: form.email.trim(),
      ...(hasMatchingEmailGrant && emailGrant
        ? { email_verification_token: emailGrant.verification_token }
        : {}),
      password: form.password,
      transaction_pin: form.transaction_pin.replace(/\D/g, "").slice(0, 4) || "1234",
      theme: FERNWAY_GREEN_THEME.id,
      account_balance: normalizeDollarString(form.account_balance, "250000.00"),
      account_number: form.account_number.replace(/\D/g, "").slice(0, 30),
      checking_account_number: form.account_number.replace(/\D/g, "").slice(0, 30),
      routing_number: form.routing_number.replace(/\D/g, "").slice(0, 30) || "021000021",
      card_holder_name:
        form.card_holder_name.trim() || `${form.first_name} ${form.last_name}`.trim(),
      card_number: formattedNumber,
      card_last4: digits.slice(-4) || "8892",
      card_expiry: form.card_expiry.trim() || "12/28",
      card_cvv: form.card_cvv.replace(/\D/g, "").slice(0, 4) || "721",
      card_pin: form.card_pin.replace(/\D/g, "").slice(0, 4) || "1234",
      card_limit: normalizeDollarString(form.card_limit, "50000.00"),
      card_is_frozen: form.card_is_frozen,
    };
  };

  const createMutation = useMutation({
    mutationFn: ({ isTest, sendEmail }: { isTest: boolean; sendEmail: boolean }) =>
      createFernwayAccount({
        test: isTest,
        send_credentials_email: sendEmail,
        ...buildPayload(),
      }),
    onSuccess: (created, variables) => {
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      if (created.id) {
        queryClient.setQueryData(["fernway-account", created.id], created);
      }
      setCreationError(null);
      if (variables.sendEmail && created.credentials_email_sent) {
        toast.success(`Account created and login details emailed to ${created.email}.`);
      } else if (variables.sendEmail && created.credentials_email_error) {
        toast.warning(
          `Account created, but the credentials email could not be sent (${created.credentials_email_error}). You can resend it below.`
        );
      } else {
        toast.success(
          created.is_test
            ? "Test account created. A simulation notice will show on Lindenway until you go live."
            : "Live monthly account activated!"
        );
      }
      setTimeout(() => {
        setShowCreateModal(false);
        if (created.id) {
          navigate(`/online-banking/${created.id}`);
        }
      }, 450);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to create account.";
      setCreationError(msg);
      toast.error(msg);
    },
  });

  const sendCredentialsMutation = useMutation({
    mutationFn: () => {
      if (!profileId) throw new Error("Missing account ID");
      return adminMode
        ? sendAdminFernwayCredentialsEmail(profileId)
        : sendFernwayCredentialsEmail(profileId);
    },
    onSuccess: (res) => {
      queryClient.setQueryData(detailQueryKey, res.profile);
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      setShowSendCredentialsModal(false);
      toast.success(`Sign-in details emailed to ${res.recipient}.`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not send login details email. Try again.";
      toast.error(msg);
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!profileId) throw new Error("Missing account ID");
      return adminMode
        ? updateAdminFernwayAccount(profileId, buildPayload())
        : updateFernwayAccountById(profileId, buildPayload());
    },
    onSuccess: (data) => {
      queryClient.setQueryData(detailQueryKey, data);
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      toast.success("Account updated successfully");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to save changes.";
      toast.error(msg);
    },
  });

  const adminSubscriptionMutation = useMutation({
    mutationFn: (action: "activate" | "extend" | "set_test" | "expire") => {
      if (!profileId) throw new Error("Missing account ID");
      return updateAdminFernwaySubscription(profileId, action, 30);
    },
    onSuccess: (data, action) => {
      queryClient.setQueryData(detailQueryKey, data);
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      const labels: Record<typeof action, string> = {
        activate: "Account set to Live Mode for 30 days.",
        extend: "Subscription extended by +30 days.",
        set_test: "Account switched to Test Mode.",
        expire: "Subscription marked as Expired.",
      };
      toast.success(labels[action]);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to update subscription status.";
      toast.error(msg);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: () => {
      if (!profileId) throw new Error("Missing account ID");
      return upgradeFernwayAccountById(profileId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["fernway-account", profileId], data);
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      setBillingError(null);
      setBillingModalMode(null);
      toast.success("Account upgraded to Live Mode for 30 days! Simulation notice removed.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to activate live account.";
      setBillingError(msg);
      toast.error(msg);
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => {
      if (!profileId) throw new Error("Missing account ID");
      return renewFernwayAccount(profileId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["fernway-account", profileId], data);
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      setBillingError(null);
      setBillingModalMode(null);
      toast.success("Monthly subscription renewed for 30 more days!");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to renew subscription.";
      setBillingError(msg);
      toast.error(msg);
    },
  });

  const addTxMutation = useMutation({
    mutationFn: (payload: NewFernwayTransactionInput) => {
      if (!profileId) throw new Error("Missing account ID");
      const primaryAccount = profile?.accounts?.[0];
      const txPayload = {
        account_id: primaryAccount?.id,
        ...payload,
      };
      return adminMode
        ? createAdminFernwayTransaction(profileId, txPayload)
        : createFernwayAccountTransaction(profileId, txPayload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: detailQueryKey });
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      const sign = data.direction === "credit" ? "+" : "-";
      toast.success(`Transaction added: ${sign}$${(data.amount / 100).toLocaleString()}`);
    },
    onError: () => toast.error("Failed to add transaction."),
  });

  const deleteTxMutation = useMutation({
    mutationFn: (txId: string) => {
      if (!profileId) throw new Error("Missing account ID");
      setDeletingTxId(txId);
      return adminMode
        ? deleteAdminFernwayTransaction(profileId, txId)
        : deleteFernwayAccountTransaction(profileId, txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailQueryKey });
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      toast.success("Transaction removed from ledger.");
    },
    onError: () => toast.error("Failed to delete transaction."),
    onSettled: () => setDeletingTxId(null),
  });

  const approveTransferMutation = useMutation({
    mutationFn: (txId: string) => {
      if (!profileId) throw new Error("Missing account ID");
      setReviewingTxId(txId);
      return adminMode
        ? approveAdminFernwayTransfer(profileId, txId)
        : approveFernwayTransfer(profileId, txId);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(detailQueryKey, updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      toast.success("Transfer approved and marked completed in Lindenway.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to approve transfer.";
      toast.error(msg);
    },
    onSettled: () => setReviewingTxId(null),
  });

  const declineTransferMutation = useMutation({
    mutationFn: (txId: string) => {
      if (!profileId) throw new Error("Missing account ID");
      setReviewingTxId(txId);
      return adminMode
        ? declineAdminFernwayTransfer(profileId, txId)
        : declineFernwayTransfer(profileId, txId);
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(detailQueryKey, updatedProfile);
      queryClient.invalidateQueries({ queryKey: ["fernway-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-fernway-accounts"] });
      toast.success("Transfer declined and funds refunded to the account balance.");
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        "Failed to decline transfer.";
      toast.error(msg);
    },
    onSettled: () => setReviewingTxId(null),
  });

  const handleReset = () => {
    setForm({
      first_name: profile?.first_name || "Alexander",
      last_name: profile?.last_name || "Hamilton",
      email: profile?.is_created ? (profile.email || "") : "",
      password: "password123",
      transaction_pin: "1234",
      theme: FERNWAY_GREEN_THEME.id,
      account_balance: "250000.00",
      account_number: profile?.accounts?.[0]?.account_number || generateAccountNumber(),
      routing_number: profile?.accounts?.[0]?.routing_number || "021000021",
      card_holder_name: `${profile?.first_name || "Alexander"} ${profile?.last_name || "Hamilton"}`.trim(),
      card_number: "4532 9182 7364 8892",
      card_expiry: "12/28",
      card_cvv: "721",
      card_pin: "1234",
      card_limit: "50000.00",
      card_is_frozen: false,
    });
    toast.success("Form reset to defaults.");
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(
      `Email: ${form.email}\nPassword: ${form.password}\nTransaction PIN: ${form.transaction_pin}`,
    );
    toast.success("Sign-in details & PIN copied!");
  };

  const handleOpenCreateDialog = () => {
    if (!validateCredentials()) return;
    setCreationError(null);
    setShowCreateModal(true);
  };

  const handleSaveChanges = () => {
    if (!validateCredentials()) return;
    saveMutation.mutate();
  };

  if (isLoading) {
    return <SvgFormTranslatorSkeleton />;
  }

  if (isError || !profile) {
    return (
      <div className="dashboard-content">
        <div className="flex flex-col gap-5 items-center justify-center h-100">
          <h2 className="text-lg text-red-500">
            Error loading {isEditingExisting ? "online banking account" : "tool"}
          </h2>
          <p className="text-sm text-gray-400">
            {error instanceof Error ? error.message : "Could not load Lindenway Online Banking."}
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => refetch()} variant="outline">
              Retry
            </Button>
            <Button asChild>
              <Link to={adminMode ? "/admin/online-banking" : "/online-banking"}>
                Back to Online Banking
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isCreated = Boolean(isEditingExisting && profile.is_created);
  const subscriptionStatus = profile.subscription_status ?? (profile.is_test ? "test" : "active");
  const isLive = Boolean(profile.is_live ?? (isCreated && subscriptionStatus === "active"));
  const isTest = !isCreated || subscriptionStatus === "test";
  const isExpired = isCreated && subscriptionStatus === "expired";
  const daysRemaining = profile.days_remaining ?? 0;
  const monthlyPrice = profile.monthly_price ?? profile.tool_price ?? 15.0;
  const walletBalance = profile.wallet_balance ?? 0.0;
  const fernwayLoginUrl = `${fernwayHomeUrl}/sign-in`;
  const fernwayLoggedInUrl =
    isCreated && profile.auth_token
      ? `${fernwayHomeUrl}/overview?token=${encodeURIComponent(profile.auth_token)}`
      : null;
  const expiryFormatted = formatExpiryDate(profile.subscription_expires_at);
  const pendingTransfers =
    profile.pending_transfers ??
    (profile.recent_transactions || []).filter(
      (tx) => tx.status === "pending" && tx.direction === "debit"
    );
  const pendingTransfersCount = profile.pending_transfers_count ?? pendingTransfers.length;

  // Shared bottom action bar rendered identically in Editor and Preview tabs (mirrors SvgFormTranslator)
  const actionButtons = (
    <div className="pt-4 border-t border-white/20 flex flex-col lg:flex-row justify-end gap-4 items-center">
      {!adminMode && isCreated && isTest && (
        <PremiumButton
          variant="outline"
          noShadow
          isLoading={upgradeMutation.isPending}
          onClick={() => {
            setBillingError(null);
            setBillingModalMode("upgrade");
          }}
          text={`Activate Live ($${monthlyPrice.toFixed(2)}/mo)`}
          icon={BadgeCheck}
          className="w-full lg:w-auto"
        />
      )}

      {!adminMode && isCreated && !isTest && (
        <PremiumButton
          variant="outline"
          noShadow
          isLoading={renewMutation.isPending}
          onClick={() => {
            setBillingError(null);
            setBillingModalMode("renew");
          }}
          text={
            isExpired
              ? `Renew Subscription ($${monthlyPrice.toFixed(2)}/mo)`
              : `Renew +30 Days ($${monthlyPrice.toFixed(2)})`
          }
          icon={RefreshCw}
          className="w-full lg:w-auto"
        />
      )}

      {!isCreated ? (
        <PremiumButton
          variant="outline"
          noShadow
          isLoading={createMutation.isPending}
          onClick={handleOpenCreateDialog}
          text={createMutation.isPending ? "Creating Account" : "Create Account"}
          icon={Upload}
          className="w-full lg:w-auto"
        />
      ) : (
        <PremiumButton
          variant="outline"
          noShadow
          isLoading={saveMutation.isPending}
          onClick={handleSaveChanges}
          text={saveMutation.isPending ? "Updating Account" : "Update Account"}
          icon={Upload}
          className="w-full lg:w-auto"
        />
      )}

      <FernwayLaunchMenu
        homeUrl={fernwayHomeUrl}
        loginUrl={fernwayLoginUrl}
        loggedInUrl={fernwayLoggedInUrl}
        className="w-full lg:w-auto"
      />
    </div>
  );

  const effectiveTab =
    !isCreated && (activeTab === "transactions" || activeTab === "support") ? "editor" : activeTab;

  return (
    <div className="dashboard-content space-y-4">
      {!adminMode && (
        <div className="flex items-center">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="bg-white/5 border-white/15 text-white/80 hover:text-white hover:bg-white/15"
          >
            <Link to="/online-banking">
              <ArrowLeft className="size-4 mr-1.5" />
              Back to Online Banking
            </Link>
          </Button>
        </div>
      )}

      {adminMode && (
        <div className="rounded-xl border border-primary/25 bg-white/[0.04] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="bg-white/5 border-white/15 text-white/80 hover:text-white hover:bg-white/15"
            >
              <Link to="/admin/online-banking">
                <ArrowLeft className="size-4 mr-1.5" />
                All Accounts
              </Link>
            </Button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/30 px-3 py-1 text-xs font-semibold text-primary">
              <Shield className="size-3.5" />
              Admin Control
            </span>
            {profile.owner && (
              <Link
                to={`/admin/users/${profile.owner.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/15 px-3 py-1 text-xs text-white/80 hover:text-white hover:border-primary/40 transition-colors"
              >
                <UserIcon className="size-3.5 text-white/50" />
                <span>
                  Owner: <strong className="text-white">{profile.owner.username}</strong> ({profile.owner.email})
                </span>
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isLive ? (
              <Button
                type="button"
                size="sm"
                loading={adminSubscriptionMutation.isPending}
                onClick={() => adminSubscriptionMutation.mutate("extend")}
                className="h-8 text-xs"
              >
                <RefreshCw className="size-3.5 mr-1.5" />
                Extend +30 Days
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                loading={adminSubscriptionMutation.isPending}
                onClick={() => adminSubscriptionMutation.mutate("activate")}
                className="h-8 text-xs"
              >
                <BadgeCheck className="size-3.5 mr-1.5" />
                Activate Live (30d)
              </Button>
            )}
            {!isTest && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={adminSubscriptionMutation.isPending}
                onClick={() => adminSubscriptionMutation.mutate("set_test")}
                className="h-8 text-xs bg-white/5 border-white/15 text-white/80 hover:bg-white/15 hover:text-white"
              >
                Set Test Mode
              </Button>
            )}
            {isLive && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={adminSubscriptionMutation.isPending}
                onClick={() => adminSubscriptionMutation.mutate("expire")}
                className="h-8 text-xs bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white"
              >
                Mark Expired
              </Button>
            )}
          </div>
        </div>
      )}

      <Tabs value={effectiveTab} onValueChange={setActiveTab} className="w-full px-0">
        <TabsList className="bg-white/10 w-full">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          {isCreated && (
            <>
              <TabsTrigger value="transactions" className="gap-1.5">
                <span>Transactions</span>
                {pendingTransfersCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/40 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-300 tabular-nums">
                    {pendingTransfersCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-1.5">
                <span>Support</span>
                {unreadSupportCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/20 border border-primary/40 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary tabular-nums">
                    {unreadSupportCount}
                  </span>
                )}
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* EDITOR TAB — matches FormPanel & FormField design 1:1 */}
        <TabsContent value="editor" className="space-y-4">
          <div className="stz-hosted-form-panel bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 space-y-6">
            {/* Header — mirrors FormPanelHeader */}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                {isCreated ? "Account Settings" : "New Banking Account"}
              </h2>
              {isCreated ? (
                <FernwayLaunchMenu
                  homeUrl={fernwayHomeUrl}
                  loginUrl={fernwayLoginUrl}
                  loggedInUrl={fernwayLoggedInUrl}
                  size="sm"
                />
              ) : (
                <Button
                  type="button"
                  onClick={handleReset}
                  variant="outline"
                  size="sm"
                  className="stz-hosted-secondary-control bg-white/10 border-white/20 text-white hover:text-white hover:bg-white/20 shrink-0"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>

            {/* Created Account Info + Monthly Subscription Strip */}
            {isCreated && (
              <div className="pb-4 border-b border-white/10 space-y-3">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 min-w-0">
                    <div className="flex gap-2 items-center min-w-0">
                      <span className="text-white font-medium text-sm shrink-0">Sign-in Email:</span>
                      <span className="text-primary py-1 px-3 border border-primary bg-primary/10 rounded-full text-sm truncate max-w-[240px]">
                        {form.email}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(form.email);
                          toast.success("Sign-in email copied!");
                        }}
                        aria-label="Copy sign-in email"
                        title="Copy sign-in email"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2 items-center min-w-0">
                      <span className="text-white font-medium text-sm shrink-0">Password:</span>
                      <span className="text-white py-1 px-3 border border-white/20 bg-white/10 rounded-full text-sm font-mono truncate max-w-[180px]">
                        {showPassword ? form.password : "•".repeat(Math.max(8, form.password.length))}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(form.password);
                          toast.success("Password copied!");
                        }}
                        aria-label="Copy password"
                        title="Copy password"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {profileId && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={sendCredentialsMutation.isPending}
                      onClick={() => setShowSendCredentialsModal(true)}
                      className="rounded-full bg-emerald-500/10 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 shrink-0 w-fit"
                    >
                      {profile.credentials_email_sent_at ? (
                        <>
                          <RefreshCw className="size-3.5 mr-1.5" />
                          Resend Login Email
                        </>
                      ) : (
                        <>
                          <Send className="size-3.5 mr-1.5" />
                          Email Login Details
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Actionable Subscription Notice (only when expiring soon, expired, or test mode) */}
                {isLive && profile.needs_renewal_reminder ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
                    <span className="flex items-center gap-2">
                      <CalendarClock className="size-4 shrink-0" />
                      <span>
                        <strong>Expiring Soon</strong> — {daysRemaining} day
                        {daysRemaining === 1 ? "" : "s"} left
                        {expiryFormatted ? ` (${expiryFormatted})` : ""}.
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBillingError(null);
                        setBillingModalMode("renew");
                      }}
                      className="h-7 px-3 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20 w-fit"
                    >
                      <RefreshCw className="size-3 mr-1.5" />
                      Renew (${monthlyPrice.toFixed(2)})
                    </Button>
                  </div>
                ) : isExpired ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="size-4 shrink-0 text-red-400" />
                      <span>
                        <strong>Subscription Expired</strong> — renew for ${monthlyPrice.toFixed(2)}/mo to restore Live Mode.
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setBillingError(null);
                        setBillingModalMode("renew");
                      }}
                      className="h-7 px-3 text-xs w-fit"
                    >
                      Renew Now
                    </Button>
                  </div>
                ) : !isLive ? (
                  <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-xs leading-5 text-amber-200/90">
                    Test Mode — activate Live (${monthlyPrice.toFixed(2)}/mo) to remove the simulation notice.
                  </p>
                ) : null}

                {pendingTransfersCount > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
                    <span className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0 text-amber-400" />
                      <span>
                        <strong>
                          {pendingTransfersCount} outgoing transfer
                          {pendingTransfersCount === 1 ? "" : "s"} awaiting approval
                        </strong>{" "}
                        — review recipient details, send manually, then approve or refund.
                      </span>
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveTab("transactions")}
                      className="h-7 px-3 text-xs w-fit shrink-0"
                    >
                      Review Transfers
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Required one-time SharpToolz owner email verification (shared with Support) */}
            {!adminMode && !isOwnerEmailVerified && (
              <VerifyAccountEmailBanner
                email={ownerEmailAddress}
                onVerified={() => setOwnerVerifiedOverride(true)}
                className="mb-6"
              />
            )}

            {/* Form Fields — single-column stack matching FormField.tsx */}
            <div className="space-y-6">
              {/* Account & Sign-In Setup */}
              <div className="space-y-3">
                <div className="space-y-2 flex flex-col">
                  <label htmlFor="fw-first-name" className="text-sm font-medium text-white">
                    First Name
                  </label>
                  <Input
                    id="fw-first-name"
                    type="text"
                    value={form.first_name}
                    onChange={(e) => {
                      const nextFirst = e.target.value;
                      setForm((prev) => {
                        const prevFull = [prev.first_name.trim(), prev.last_name.trim()]
                          .filter(Boolean)
                          .join(" ");
                        const nextFull = [nextFirst.trim(), prev.last_name.trim()]
                          .filter(Boolean)
                          .join(" ");
                        const shouldSyncCard =
                          !prev.card_holder_name.trim() ||
                          prev.card_holder_name.trim().toLowerCase() === prevFull.toLowerCase();
                        return {
                          ...prev,
                          first_name: nextFirst,
                          card_holder_name: shouldSyncCard ? nextFull : prev.card_holder_name,
                        };
                      });
                    }}
                    placeholder="e.g. Alexander"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                  />
                </div>

                <div className="space-y-2 flex flex-col">
                  <label htmlFor="fw-last-name" className="text-sm font-medium text-white">
                    Last Name
                  </label>
                  <Input
                    id="fw-last-name"
                    type="text"
                    value={form.last_name}
                    onChange={(e) => {
                      const nextLast = e.target.value;
                      setForm((prev) => {
                        const prevFull = [prev.first_name.trim(), prev.last_name.trim()]
                          .filter(Boolean)
                          .join(" ");
                        const nextFull = [prev.first_name.trim(), nextLast.trim()]
                          .filter(Boolean)
                          .join(" ");
                        const shouldSyncCard =
                          !prev.card_holder_name.trim() ||
                          prev.card_holder_name.trim().toLowerCase() === prevFull.toLowerCase();
                        return {
                          ...prev,
                          last_name: nextLast,
                          card_holder_name: shouldSyncCard ? nextFull : prev.card_holder_name,
                        };
                      });
                    }}
                    placeholder="e.g. Hamilton"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                  />
                </div>

                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="fw-email" className="text-sm font-medium text-white">
                      Sign-In Email
                    </label>
                    {isEmailVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 className="size-3" />
                        Verified · Client alerts on
                      </span>
                    ) : normalizedEmail ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/60">
                        Optional · Client alerts off
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="fw-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        const nextEmail = e.target.value;
                        setForm({ ...form, email: nextEmail });
                        if (emailGrant && emailGrant.email.toLowerCase() !== nextEmail.trim().toLowerCase()) {
                          setEmailGrant(null);
                        }
                        if (emailChallenge) {
                          setEmailChallenge(null);
                          setEmailCode("");
                        }
                      }}
                      placeholder="e.g. name@lindenwaybank.com or client@gmail.com"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 flex-1"
                    />
                    {!isEmailVerified && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSendingCode || !normalizedEmail.includes("@")}
                        onClick={handleRequestEmailCode}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-4 shrink-0"
                      >
                        {isSendingCode ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MailCheck className="w-4 h-4 mr-2" />
                        )}
                        {emailChallenge ? "Resend Code" : "Verify Email (Optional)"}
                      </Button>
                    )}
                  </div>

                  {emailChallenge && !isEmailVerified && (
                    <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-3.5 space-y-2.5">
                      <p className="text-xs text-white/80">
                        Enter the 4-digit code sent to{" "}
                        <strong className="font-mono text-emerald-300">{emailChallenge.email_hint}</strong>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={4}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="0000"
                          aria-label="4-digit email verification code"
                          className="bg-white/10 border-white/20 text-white text-center font-mono tracking-[0.35em] sm:w-36"
                        />
                        <Button
                          type="button"
                          disabled={isConfirmingCode || emailCode.length !== 4}
                          onClick={handleConfirmEmailCode}
                          className="rounded-full px-5"
                        >
                          {isConfirmingCode ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          Confirm Code
                        </Button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-white/40">
                    {isEmailVerified
                      ? "Verified — your client will receive Lindenway login, transfer, card, and support emails at this address."
                      : "Optional — you can create or save without verifying. Verify with a 4-digit code only if you want your client to receive Lindenway login, transfer, card, and support emails (your SharpToolz email still receives owner alerts)."}
                  </p>
                </div>

                <div className="space-y-2 w-full">
                  <label htmlFor="fw-password" className="text-sm font-medium text-white">
                    Sign-In Password
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="fw-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Create a password for Lindenway"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, password: generateRandomPassword() }));
                        setShowPassword(true);
                      }}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-4"
                      title="Generate random password"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <label htmlFor="fw-transaction-pin" className="text-sm font-medium text-white">
                    Transaction PIN
                    <span className="text-gray-400 ml-1">(4 digits)</span>
                  </label>
                  <PinBoxesInput
                    id="fw-transaction-pin"
                    value={form.transaction_pin}
                    onChange={(nextPin) => setForm((prev) => ({ ...prev, transaction_pin: nextPin }))}
                    onGenerate={() =>
                      setForm((prev) => ({ ...prev, transaction_pin: generateTransactionPin() }))
                    }
                  />
                  <p className="text-xs text-white/40">
                    Required inside Lindenway before sending any outgoing bank transfer.
                  </p>
                </div>
              </div>

              {/* Single Unified Account Balance */}
              <div className="space-y-3 pt-5 border-t border-white/10">
                <div className="space-y-2 w-full">
                  <label htmlFor="fw-balance" className="text-sm font-medium text-white">
                    Account Balance ($)
                  </label>
                  <Input
                    id="fw-balance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.account_balance}
                    onChange={(e) => setForm({ ...form, account_balance: e.target.value })}
                    placeholder="e.g. 250000.00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-white/45 mr-1">Quick amounts:</span>
                  {BALANCE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          account_balance: preset.balance,
                        }))
                      }
                      className="h-8 rounded-full bg-white/5 border-white/20 text-xs text-white/80 hover:bg-white/15 hover:text-white"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2 w-full pt-2">
                  <label htmlFor="fw-account-number" className="text-sm font-medium text-white">
                    Account Number
                    <span className="text-gray-400 ml-1">(for Add Money / Direct Deposit)</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="fw-account-number"
                      type="text"
                      inputMode="numeric"
                      maxLength={30}
                      value={form.account_number}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          account_number: e.target.value.replace(/\D/g, "").slice(0, 30),
                        })
                      }
                      placeholder="e.g. 3260636900"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 font-mono"
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, account_number: generateAccountNumber() }))
                      }
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-4"
                      title="Generate random account number"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-white/40">
                    Shown inside Lindenway under &ldquo;Add Money&rdquo; for receiving bank transfers and direct deposits.
                  </p>
                </div>

                <div className="space-y-2 w-full">
                  <label htmlFor="fw-routing-number" className="text-sm font-medium text-white">
                    Routing Number
                    <span className="text-gray-400 ml-1">(9 digits)</span>
                  </label>
                  <Input
                    id="fw-routing-number"
                    type="text"
                    inputMode="numeric"
                    maxLength={15}
                    value={form.routing_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        routing_number: e.target.value.replace(/\D/g, "").slice(0, 15),
                      })
                    }
                    placeholder="e.g. 021000021"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 font-mono"
                  />
                </div>
              </div>

              {/* Physical Debit Card */}
              <div className="space-y-3 pt-5 border-t border-white/10">
                <div className="space-y-2 flex flex-col">
                  <label htmlFor="fw-card-holder" className="text-sm font-medium text-white">
                    Name on Physical Card
                  </label>
                  <Input
                    id="fw-card-holder"
                    type="text"
                    value={form.card_holder_name}
                    onChange={(e) => setForm({ ...form, card_holder_name: e.target.value })}
                    placeholder="e.g. Alexander Hamilton"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                  />
                </div>

                <div className="space-y-2 w-full">
                  <label htmlFor="fw-card-number" className="text-sm font-medium text-white">
                    Card Number
                    <span className="text-gray-400 ml-1">(16 digits)</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="fw-card-number"
                      type="text"
                      inputMode="numeric"
                      maxLength={19}
                      value={form.card_number}
                      onChange={(e) =>
                        setForm({ ...form, card_number: formatCardNumber(e.target.value) })
                      }
                      placeholder="4532 9182 7364 8892"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 font-mono"
                    />
                    <Button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, card_number: generateCardNumber() }))
                      }
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-4"
                      title="Generate random card number"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col">
                  <label htmlFor="fw-card-expiry" className="text-sm font-medium text-white">
                    Expiry Date
                    <span className="text-gray-400 ml-1">(MM/YY)</span>
                  </label>
                  <Input
                    id="fw-card-expiry"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={form.card_expiry}
                    onChange={(e) =>
                      setForm({ ...form, card_expiry: formatCardExpiry(e.target.value) })
                    }
                    placeholder="12/28"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 font-mono"
                  />
                </div>

                <div className="space-y-2 w-full">
                  <label htmlFor="fw-card-cvv" className="text-sm font-medium text-white">
                    CVV
                    <span className="text-gray-400 ml-1">(3–4 digits)</span>
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="fw-card-cvv"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={form.card_cvv}
                      onChange={(e) =>
                        setForm({ ...form, card_cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                      placeholder="721"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0 font-mono"
                    />
                    <Button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, card_cvv: generateCvv() }))}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-4"
                      title="Generate random CVV"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 w-full">
                  <label htmlFor="fw-card-pin" className="text-sm font-medium text-white">
                    Card PIN
                    <span className="text-gray-400 ml-1">(4 digits)</span>
                  </label>
                  <PinBoxesInput
                    id="fw-card-pin"
                    value={form.card_pin}
                    onChange={(nextPin) => setForm((prev) => ({ ...prev, card_pin: nextPin }))}
                    onGenerate={() =>
                      setForm((prev) => ({ ...prev, card_pin: generateTransactionPin() }))
                    }
                  />
                  <p className="text-xs text-white/40">
                    4-digit physical debit card PIN shown inside Lindenway card details.
                  </p>
                </div>

                <div className="space-y-2 w-full">
                  <label htmlFor="fw-card-limit" className="text-sm font-medium text-white">
                    Monthly Card Limit ($)
                  </label>
                  <Input
                    id="fw-card-limit"
                    type="number"
                    step="100"
                    min="0"
                    value={form.card_limit}
                    onChange={(e) => setForm({ ...form, card_limit: e.target.value })}
                    placeholder="e.g. 50000.00"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                  />
                </div>

                <div
                  onClick={() => setForm((prev) => ({ ...prev, card_is_frozen: !prev.card_is_frozen }))}
                  className="flex items-center justify-between px-6 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group"
                >
                  <div>
                    <span className="text-sm font-bold text-white group-hover:text-primary transition-colors block">
                      Freeze Physical Card
                    </span>
                    <span className="text-xs text-white/40">
                      Show this card as temporarily frozen inside Lindenway
                    </span>
                  </div>
                  <Checkbox
                    id="fw-card-frozen"
                    checked={form.card_is_frozen}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, card_is_frozen: Boolean(checked) }))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="size-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {actionButtons}
        </TabsContent>

        {/* PREVIEW TAB — real Fernway website live iframe + shared action bar */}
        <TabsContent value="preview" className="space-y-4">
          <FernwayPreviewPanel
            form={form}
            isCreated={isCreated}
            isLive={isLive}
            subscriptionStatus={subscriptionStatus}
            authToken={profile.auth_token}
            onCopyCredentials={copyCredentials}
          />
          {actionButtons}
        </TabsContent>

        {/* TRANSACTIONS TAB — pending approvals + ledger + Add Transaction dialog */}
        {isCreated && (
          <TabsContent value="transactions" className="mt-4">
            <FernwayTransactionsTab
              transactions={profile.recent_transactions || []}
              pendingTransfers={pendingTransfers}
              isAdding={addTxMutation.isPending}
              deletingId={deletingTxId}
              reviewingId={reviewingTxId}
              onAddTransaction={(payload) => addTxMutation.mutateAsync(payload)}
              onDeleteTransaction={(txId) => deleteTxMutation.mutate(txId)}
              onApproveTransfer={(txId) => approveTransferMutation.mutate(txId)}
              onDeclineTransfer={(txId) => declineTransferMutation.mutate(txId)}
            />
          </TabsContent>
        )}

        {/* SUPPORT TAB — live banking support conversations (same Pusher realtime tech) */}
        {isCreated && profileId && (
          <TabsContent value="support" className="mt-4">
            <FernwaySupportMessages profileId={profileId} />
          </TabsContent>
        )}
      </Tabs>

      {/* Modals */}
      <CreateAccountDialog
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreateTest={(sendEmail) => createMutation.mutate({ isTest: true, sendEmail })}
        onCreateLive={(sendEmail) => createMutation.mutate({ isTest: false, sendEmail })}
        isSubmitting={createMutation.isPending}
        price={monthlyPrice}
        walletBalance={walletBalance}
        recipientEmail={form.email.trim()}
        error={creationError}
      />

      {isCreated && profileId && (
        <SendCredentialsDialog
          open={showSendCredentialsModal}
          onOpenChange={setShowSendCredentialsModal}
          onConfirm={() => sendCredentialsMutation.mutate()}
          isSubmitting={sendCredentialsMutation.isPending}
          accountEmail={profile.email}
          accountHolder={`${profile.first_name} ${profile.last_name}`.trim() || "Account Holder"}
          portalUrl={fernwayHomeUrl}
          lastSentAt={profile.credentials_email_sent_at}
        />
      )}

      <SubscriptionBillingDialog
        mode={billingModalMode ?? "upgrade"}
        open={billingModalMode !== null}
        onOpenChange={(open) => {
          if (!open) setBillingModalMode(null);
        }}
        onConfirm={() => {
          if (billingModalMode === "renew") {
            renewMutation.mutate();
          } else {
            upgradeMutation.mutate();
          }
        }}
        isSubmitting={upgradeMutation.isPending || renewMutation.isPending}
        price={monthlyPrice}
        walletBalance={walletBalance}
        accountEmail={profile.email}
        error={billingError}
      />
    </div>
  );
}
