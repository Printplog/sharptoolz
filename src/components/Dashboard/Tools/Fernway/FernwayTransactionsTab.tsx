import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Copy,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { FernwayTransaction } from "@/api/apiEndpoints";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUsd } from "./themes";

export interface NewFernwayTransactionInput {
  direction: "credit" | "debit";
  amount: number;
  counterparty: string;
  narration: string;
  category: string;
  channel: string;
  adjust_balance: boolean;
}

interface FernwayTransactionsTabProps {
  transactions: FernwayTransaction[];
  pendingTransfers?: FernwayTransaction[];
  isAdding: boolean;
  deletingId?: string | null;
  reviewingId?: string | null;
  onAddTransaction: (payload: NewFernwayTransactionInput) => Promise<unknown>;
  onDeleteTransaction: (id: string) => void;
  onApproveTransfer?: (id: string) => void;
  onDeclineTransfer?: (id: string) => void;
}

const DEFAULT_TX = {
  direction: "credit" as "credit" | "debit",
  amount: "5000.00",
  counterparty: "Direct Deposit Payroll",
  narration: "Monthly salary deposit",
  category: "income",
  channel: "wire",
  adjust_balance: true,
};

function formatTxDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function copyText(label: string, value: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${label} copied`);
}

export function FernwayTransactionsTab({
  transactions,
  pendingTransfers = [],
  isAdding,
  deletingId,
  reviewingId,
  onAddTransaction,
  onDeleteTransaction,
  onApproveTransfer,
  onDeclineTransfer,
}: FernwayTransactionsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTx, setNewTx] = useState(DEFAULT_TX);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number.parseFloat(newTx.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid transaction amount.");
      return;
    }
    if (!newTx.counterparty.trim()) {
      toast.error("Please enter a merchant or counterparty name.");
      return;
    }
    try {
      await onAddTransaction({
        direction: newTx.direction,
        amount: Number(amount.toFixed(2)),
        counterparty: newTx.counterparty.trim(),
        narration: newTx.narration.trim(),
        category: newTx.category,
        channel: newTx.channel,
        adjust_balance: newTx.adjust_balance,
      });
      setDialogOpen(false);
      setNewTx(DEFAULT_TX);
    } catch {
      // Error toast is already handled by mutation onError
    }
  };

  return (
    <div className="space-y-5">
      {/* Pending Outgoing Transfers awaiting manual payout & approval */}
      {pendingTransfers.length > 0 && (
        <div className="bg-white/5 border border-amber-500/35 rounded-lg p-4 sm:p-6 space-y-4">
          <div className="flex items-start gap-3 pb-4 border-b border-white/10">
            <div className="size-9 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Clock className="size-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Pending Transfer Approvals ({pendingTransfers.length})
              </h2>
              <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
                Submitted from Fernway. Review the recipient details below, send the money manually,
                then click <strong className="text-white">Approve</strong> to mark it completed in
                Fernway — or <strong className="text-white">Decline &amp; Refund</strong> to return
                the funds to their balance.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pendingTransfers.map((tx) => {
              const isReviewing = reviewingId === tx.id;
              return (
                <div
                  key={tx.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold text-white">
                          {tx.counterparty}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/35 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                          <Clock className="size-2.5" />
                          Pending Approval
                        </span>
                      </div>
                      <div className="text-xs text-white/45 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-mono">{tx.reference}</span>
                        <span>•</span>
                        <span>{formatTxDate(tx.created_at || tx.occurred_at)}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xl font-bold text-white tabular-nums">
                        {formatUsd(Math.abs(tx.amount) / 100)}
                      </div>
                      <div className="text-[11px] text-white/45">Already deducted from balance</div>
                    </div>
                  </div>

                  {/* Recipient account details for manual payout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-black/25 border border-white/10 p-3.5 text-xs">
                    <div>
                      <div className="text-white/45">Recipient Name</div>
                      <div className="text-white font-medium mt-0.5">{tx.counterparty}</div>
                    </div>

                    <div>
                      <div className="text-white/45">Bank Name</div>
                      <div className="text-white font-medium mt-0.5">
                        {tx.bank_name || tx.counterparty_detail || "Not provided"}
                      </div>
                    </div>

                    <div>
                      <div className="text-white/45">Account Number</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-white font-medium">
                          {tx.recipient_account_number || "Not provided"}
                        </span>
                        {tx.recipient_account_number && (
                          <button
                            type="button"
                            onClick={() =>
                              copyText("Account number", tx.recipient_account_number!)
                            }
                            className="text-white/50 hover:text-primary transition-colors cursor-pointer"
                            title="Copy account number"
                            aria-label="Copy account number"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-white/45">Routing Number</div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-white font-medium">
                          {tx.recipient_routing_number || "Not provided"}
                        </span>
                        {tx.recipient_routing_number && (
                          <button
                            type="button"
                            onClick={() =>
                              copyText("Routing number", tx.recipient_routing_number!)
                            }
                            className="text-white/50 hover:text-primary transition-colors cursor-pointer"
                            title="Copy routing number"
                            aria-label="Copy routing number"
                          >
                            <Copy className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {tx.narration && (
                      <div className="sm:col-span-2 pt-2 border-t border-white/10">
                        <div className="text-white/45">Note / Reference</div>
                        <div className="text-white/85 mt-0.5">{tx.narration}</div>
                      </div>
                    )}
                  </div>

                  {/* Approve / Decline buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    {onDeclineTransfer && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isReviewing}
                        onClick={() => onDeclineTransfer(tx.id)}
                        className="bg-red-500/10 border-red-500/35 text-red-300 hover:bg-red-500 hover:text-white"
                      >
                        <XCircle className="size-4 mr-1.5" />
                        Decline &amp; Refund
                      </Button>
                    )}
                    {onApproveTransfer && (
                      <Button
                        type="button"
                        size="sm"
                        loading={isReviewing}
                        disabled={isReviewing}
                        onClick={() => onApproveTransfer(tx.id)}
                        className="px-5"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Approve Transfer
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Clean Ledger Panel — matches FormPanel surface */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Transaction Ledger ({transactions.length})
            </h2>
            <p className="text-xs text-white/45 mt-0.5">
              Entries shown here appear immediately in your Fernway online banking history.
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => setDialogOpen(true)} className="shrink-0">
            <Plus className="size-4 mr-1.5" />
            Add Transaction
          </Button>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm text-white/40">
              No transactions yet. Add your first entry to populate the ledger.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Plus className="size-4 mr-1.5" />
              Add Transaction
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {transactions.map((tx) => {
              const isPending = tx.status === "pending";
              const isFailed = tx.status === "failed";
              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/[0.03] px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                        tx.direction === "credit"
                          ? "bg-primary/15 text-primary"
                          : isPending
                            ? "bg-amber-500/15 text-amber-300"
                            : isFailed
                              ? "bg-red-500/15 text-red-300"
                              : "bg-white/10 text-white/70"
                      }`}
                    >
                      {tx.direction === "credit" ? (
                        <ArrowDownLeft className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {tx.counterparty}
                        </span>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/35 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            Pending
                          </span>
                        )}
                        {isFailed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-400/35 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                            Declined
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/45 truncate mt-0.5">
                        {tx.bank_name && tx.recipient_account_number
                          ? `${tx.bank_name} · Acct ${tx.recipient_account_number}${tx.narration ? ` · ${tx.narration}` : ""}`
                          : tx.narration || tx.counterparty_detail || tx.reference}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-mono text-sm font-semibold ${
                        isFailed
                          ? "text-white/40 line-through"
                          : tx.direction === "credit"
                            ? "text-primary"
                            : "text-white"
                      }`}
                    >
                      {tx.direction === "credit" ? "+" : "-"}
                      {formatUsd(Math.abs(tx.amount) / 100)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={deletingId === tx.id}
                      onClick={() => onDeleteTransaction(tx.id)}
                      aria-label={`Delete ${tx.counterparty}`}
                      className="size-8 bg-white/5 border-white/15 text-white/60 hover:text-red-400 hover:border-red-400/40"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(next) => {
          if (!isAdding) setDialogOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl">
          <DialogHeader className="p-6 pb-2 text-left">
            <DialogTitle className="text-xl font-bold text-white tracking-tight">
              Add Transaction
            </DialogTitle>
            <DialogDescription className="text-white/50 text-xs">
              Add a deposit or expense to your Fernway account history.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
              <div className="space-y-2 w-full">
                <label htmlFor="tx-direction" className="text-sm font-medium text-white">
                  Type
                </label>
                <Select
                  value={newTx.direction}
                  onValueChange={(val) =>
                    setNewTx((prev) => ({ ...prev, direction: val as "credit" | "debit" }))
                  }
                >
                  <SelectTrigger
                    id="tx-direction"
                    className="bg-white/10 border-white/20 text-white w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/20 z-[300]">
                    <SelectItem value="credit" className="text-white hover:bg-white/10">
                      Money In (Deposit +)
                    </SelectItem>
                    <SelectItem value="debit" className="text-white hover:bg-white/10">
                      Money Out (Expense -)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col">
                <label htmlFor="tx-amount" className="text-sm font-medium text-white">
                  Amount ($)
                </label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newTx.amount}
                  onChange={(e) => setNewTx((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="e.g. 5000.00"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <label htmlFor="tx-counterparty" className="text-sm font-medium text-white">
                  Sender or Merchant
                </label>
                <Input
                  id="tx-counterparty"
                  type="text"
                  value={newTx.counterparty}
                  onChange={(e) => setNewTx((prev) => ({ ...prev, counterparty: e.target.value }))}
                  placeholder="e.g. Direct Deposit Payroll"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                />
              </div>

              <div className="space-y-2 w-full">
                <label htmlFor="tx-category" className="text-sm font-medium text-white">
                  Category
                </label>
                <Select
                  value={newTx.category}
                  onValueChange={(val) => setNewTx((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger
                    id="tx-category"
                    className="bg-white/10 border-white/20 text-white w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/20 z-[300]">
                    <SelectItem value="income" className="text-white hover:bg-white/10">
                      Income &amp; Deposits
                    </SelectItem>
                    <SelectItem value="transfer" className="text-white hover:bg-white/10">
                      Transfer
                    </SelectItem>
                    <SelectItem value="shopping" className="text-white hover:bg-white/10">
                      Shopping
                    </SelectItem>
                    <SelectItem value="dining" className="text-white hover:bg-white/10">
                      Food &amp; Dining
                    </SelectItem>
                    <SelectItem value="bills" className="text-white hover:bg-white/10">
                      Bills &amp; Utilities
                    </SelectItem>
                    <SelectItem value="savings" className="text-white hover:bg-white/10">
                      Savings &amp; Investments
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex flex-col">
                <label htmlFor="tx-narration" className="text-sm font-medium text-white">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Input
                  id="tx-narration"
                  type="text"
                  value={newTx.narration}
                  onChange={(e) => setNewTx((prev) => ({ ...prev, narration: e.target.value }))}
                  placeholder="e.g. Monthly salary deposit"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 outline-0"
                />
              </div>

              {/* Pill checkbox row — identical to FormField checkbox styling */}
              <div
                onClick={() =>
                  setNewTx((prev) => ({ ...prev, adjust_balance: !prev.adjust_balance }))
                }
                className="flex items-center justify-between px-6 py-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer transition-all duration-200 group"
              >
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  Update account balance automatically
                </span>
                <Checkbox
                  checked={newTx.adjust_balance}
                  onCheckedChange={(checked) =>
                    setNewTx((prev) => ({ ...prev, adjust_balance: Boolean(checked) }))
                  }
                  onClick={(e) => e.stopPropagation()}
                  className="size-5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                />
              </div>
            </div>

            <DialogFooter className="p-6 pt-4 border-t border-white/10 bg-white/[0.02] flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isAdding}
                onClick={() => setDialogOpen(false)}
                className="bg-white/5 border-white/15 text-white/70 hover:text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button type="submit" loading={isAdding} className="px-6">
                <Plus className="size-4 mr-1.5" />
                Add Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
