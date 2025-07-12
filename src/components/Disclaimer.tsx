import { Info } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="mt-10 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 text-sm text-muted-foreground flex items-start gap-3">
      <Info className="w-5 h-5 mt-0.5 text-primary shrink-0" />
      <div>
        <strong className="block text-white mb-1">Disclaimer</strong>
        <p>
          Documents generated on this platform are for <strong>demonstration and testing purposes</strong> only. Use them to create professional-looking sample invoices, contracts, and reports instantly.
        </p>
      </div>
    </div>
  );
}
