import HotTools from "@/components/Dashboard/Dashboard/HotTools";
import Stats from "@/components/Dashboard/Dashboard/Stats";


export default function Dashboard() {
  return (
      <div className="space-y-6">
        {/* Analytics Cards */}
        <Stats />

        <HotTools />
      </div>
  );
}