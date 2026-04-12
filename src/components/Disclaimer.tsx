import { Info } from "lucide-react";

export default function Disclaimer() {
  return (
    <div className="dashboard-content mt-10 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm p-4 text-sm text-muted-foreground flex items-start gap-3">
      <Info className="w-5 h-5 mt-0.5 text-primary shrink-0" />
      <div>
        <strong className="block text-white mb-1">Disclaimer</strong>
        <p>
          Documents generated on this platform are for <strong>demonstration, educational, and testing purposes</strong> only. Any unauthorized or illegal use is strictly prohibited. The user is solely responsible for the use and handling of any files generated.
        </p>
      </div>
    </div>
  );
}
