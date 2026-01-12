import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, DollarSign } from "lucide-react";
import type { AdminUsers } from "@/types";
import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface UsersOverviewProps {
  data: AdminUsers | null | undefined;
  isLoading?: boolean;
}

export default function UsersOverview({ data, isLoading }: UsersOverviewProps) {
  const [newUsersRange, setNewUsersRange] = useState("today");
  const [purchasesRange, setPurchasesRange] = useState("today");

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
              <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-white/10 mb-2" />
              <Skeleton className="h-4 w-32 bg-white/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Helper function to get new users count based on selected range
  const getNewUsersCount = () => {
    if (!data?.new_users) return 0;
    switch (newUsersRange) {
      case "today": return data.new_users.today;
      case "7d": return data.new_users.past_7_days;
      case "14d": return data.new_users.past_14_days;
      case "30d": return data.new_users.past_30_days;
      default: return data.new_users.today;
    }
  };

  // Helper function to get purchases count based on selected range
  const getPurchasesCount = () => {
    if (!data?.total_purchases_users) return 0;
    switch (purchasesRange) {
      case "today": return data.total_purchases_users.today;
      case "7d": return data.total_purchases_users.past_7_days;
      case "14d": return data.total_purchases_users.past_14_days;
      case "30d": return data.total_purchases_users.past_30_days;
      default: return data.total_purchases_users.today;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Total Users */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-blue-100">
            Total Users
          </CardTitle>
          <div className="p-2 rounded-full bg-blue-500/20 text-blue-400">
            <Users className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-blue-100">{data?.all_users}</p>
            <span className="text-xs text-blue-300">+5%</span>
          </div>
          <p className="text-xs text-blue-200/70 mt-1">
            Registered accounts
          </p>
        </CardContent>
      </Card>

      {/* New Users */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-purple-100">
            New Users
          </CardTitle>
          <div className="p-2 rounded-full bg-purple-500/20 text-purple-400">
            <UserPlus className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-purple-100">+{getNewUsersCount()}</p>
            <Select value={newUsersRange} onValueChange={setNewUsersRange}>
              <SelectTrigger className="w-[120px] h-8 bg-purple-500/20 border-purple-500/30 text-purple-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20 text-white">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Past 7 days</SelectItem>
                <SelectItem value="14d">Past 14 days</SelectItem>
                <SelectItem value="30d">Past 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-purple-200/70 mt-1">
            {newUsersRange === "today" ? "Today" :
              newUsersRange === "7d" ? "Past 7 days" :
                newUsersRange === "14d" ? "Past 14 days" : "Past 30 days"}
          </p>
        </CardContent>
      </Card>

      {/* Total Purchases */}
      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-green-100">
            Total Purchases
          </CardTitle>
          <div className="p-2 rounded-full bg-green-500/20 text-green-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-green-100">{getPurchasesCount()}</p>
            <Select value={purchasesRange} onValueChange={setPurchasesRange}>
              <SelectTrigger className="w-[120px] h-8 bg-green-500/20 border-green-500/30 text-green-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-white/20 text-white">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Past 7 days</SelectItem>
                <SelectItem value="14d">Past 14 days</SelectItem>
                <SelectItem value="30d">Past 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-green-200/70 mt-1">
            {purchasesRange === "today" ? "Today" :
              purchasesRange === "7d" ? "Past 7 days" :
                purchasesRange === "14d" ? "Past 14 days" : "Past 30 days"} documents purchased
          </p>
        </CardContent>
      </Card>
    </div>
  );
}