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
      <div className="dashboard-content space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-12 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <p className="text-red-400 text-center font-medium italic">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content space-y-6 p-6">
      <h1 className="text-3xl font-bold text-white tracking-tighter uppercase italic">
        User <span className="text-primary">Management</span>
      </h1>

      <UsersOverview data={data} isLoading={isLoading} />

      <UsersTable />
    </div>
  );
}
