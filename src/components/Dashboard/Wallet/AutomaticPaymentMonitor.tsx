import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getCryptoPaymentStatus } from "@/api/apiEndpoints";


type AutomaticPaymentMonitorProps = {
  transactionId: string;
  onConfirmed?: () => void;
};


export default function AutomaticPaymentMonitor({
  transactionId,
  onConfirmed,
}: AutomaticPaymentMonitorProps) {
  const announced = useRef(false);
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: ["crypto-payment-status", transactionId],
    queryFn: () => getCryptoPaymentStatus(transactionId),
    refetchInterval: (query) => query.state.data?.credited ? false : 5000,
    refetchIntervalInBackground: true,
    retry: 2,
  });

  const payment = statusQuery.data;
  useEffect(() => {
    if (!payment?.credited || announced.current) return;
    announced.current = true;
    void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    toast.success(`${Number(payment.amount).toFixed(2)} USDT added to your wallet.`);
    onConfirmed?.();
  }, [payment, onConfirmed, queryClient]);

  return null;
}
