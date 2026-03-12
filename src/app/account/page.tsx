"use client";

import { authClient } from "@/lib/auth-client";
import { useUiPreferences } from "@/lib/ui-preferences";
import GuestAccountView from "./_components/GuestAccountView";
import AccountDashboard from "./_components/AccountDashboard";

function AccountSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="border border-border rounded-[20px] bg-surface-card overflow-hidden">
        <div className="px-6 py-6 bg-surface-section flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-border shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 rounded-full bg-border" />
            <div className="h-4 w-56 rounded-full bg-border" />
            <div className="h-3 w-32 rounded-full bg-border" />
          </div>
        </div>
        <div className="flex divide-x divide-border border-t border-border">
          <div className="flex-1 px-4 py-4">
            <div className="h-6 w-8 mx-auto rounded bg-border mb-1" />
            <div className="h-3 w-16 mx-auto rounded bg-border" />
          </div>
          <div className="flex-1 px-4 py-4">
            <div className="h-6 w-8 mx-auto rounded bg-border mb-1" />
            <div className="h-3 w-16 mx-auto rounded bg-border" />
          </div>
        </div>
      </div>
      <div className="border-b border-border flex gap-6 pb-0">
        {[100, 120, 90].map((w) => (
          <div key={w} className="pb-3">
            <div
              className={`h-4 w-${w === 100 ? "20" : w === 120 ? "24" : "18"} rounded-full bg-border`}
            />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-[20px] bg-border" />
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { t } = useUiPreferences();
  const { data: session, isPending } = authClient.useSession();

  return (
    <main className="min-h-[calc(100vh-220px)] px-4 py-12 bg-background">
      <div className="max-w-frame mx-auto">
        {isPending ? (
          <AccountSkeleton />
        ) : session ? (
          <AccountDashboard session={session} />
        ) : (
          <GuestAccountView />
        )}
      </div>
    </main>
  );
}
