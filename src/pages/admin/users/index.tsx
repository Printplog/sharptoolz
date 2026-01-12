import { useEffect } from "react";
import { useUsersStore } from "@/store/usersStore";
import UsersOverview from "@/components/Admin/Users/Overview";
import UsersTable from "@/components/Admin/Users/UsersTable";

export default function Users() {
  const { data, isLoading, error, fetchUsers } = useUsersStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400 text-center">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Users Overview */}
      <UsersOverview data={data} isLoading={isLoading} />

      {/* Users Table */}
      <UsersTable />
    </div>
  );
}
