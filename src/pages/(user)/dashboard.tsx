import HotTools from "@/components/Dashboard/Dashboard/HotTools";
import Stats from "@/components/Dashboard/Dashboard/Stats";
import QuickActions from "@/components/Dashboard/Dashboard/QuickActions";


export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <Stats />

      {/* Quick Actions */}
      <QuickActions />

      {/* Hot Tools - only shows if there are hot tools */}
      <HotTools />
    </div>
  );
}