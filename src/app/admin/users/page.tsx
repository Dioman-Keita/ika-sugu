import { Users } from "lucide-react";
import { getAdminUsers } from "@/app/actions/admin";
import AdminPagination from "@/components/admin/AdminPagination";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

function getInitials(name: string, email: string): string {
  const trimmed = name.trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return trimmed.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const { users, total, totalPages, currentPage } = await getAdminUsers({ page });

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border bg-surface-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-muted-foreground" />
          <h1 className="text-lg font-bold text-foreground">Users</h1>
          <span className="ml-2 text-xs font-medium bg-surface-section px-2 py-0.5 rounded-full text-muted-foreground">
            {total}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="border border-border rounded-2xl bg-surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-section">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    User
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Email verified
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Orders
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const initials = getInitials(user.name, user.email);
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-surface-section/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0">
                              <span className="text-[11px] font-bold text-background">
                                {initials}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {user.emailVerified ? (
                            <span className="text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                              Verified
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground">
                          {user.ordersCount}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-5">
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl="/admin/users"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
