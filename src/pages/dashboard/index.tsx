import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Wallet,
  Users,
  Download,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  return (
      <div className="p-4 md:p-8 space-y-6">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Documents */}
          <Card className="bg-white/10 border border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <div className="p-2 rounded-full bg-primary/20 text-primary">
                <FileText className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1,250</p>
              <p className="text-xs opacity-70">+12% from last month</p>
            </CardContent>
          </Card>

          {/* Wallet Balance */}
          <Card className="bg-white/10 border border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <div className="p-2 rounded-full bg-green-500/20 text-green-500">
                <Wallet className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$4,520.00</p>
              <p className="text-xs opacity-70">+5.2% this week</p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="bg-white/10 border border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <div className="p-2 rounded-full bg-blue-500/20 text-blue-500">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">8,420</p>
              <p className="text-xs opacity-70">+2.1k new users</p>
            </CardContent>
          </Card>

          {/* Downloads */}
          <Card className="bg-white/10 border border-white/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <div className="p-2 rounded-full bg-purple-500/20 text-purple-500">
                <Download className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">32,900</p>
              <p className="text-xs opacity-70">Top content: PDF Templates</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart & Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Activity Chart Placeholder */}
          <Card className="lg:col-span-2 bg-white/10 border border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Monthly Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center bg-white/5 rounded-lg border border-white/10">
                <Activity className="h-10 w-10 text-muted-foreground opacity-30" />
                <span className="ml-2 text-sm text-muted-foreground">Chart goes here</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/10 border border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>New document created</span>
                <span className="text-xs text-muted-foreground">10m ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile updated</span>
                <span className="text-xs text-muted-foreground">32m ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment received</span>
                <span className="text-xs text-muted-foreground">1h ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Login from new device</span>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}