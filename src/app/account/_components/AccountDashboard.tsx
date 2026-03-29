"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Package, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiPreferences } from "@/lib/ui-preferences";
import { authClient } from "@/lib/auth-client";
import { useCartCount } from "@/hooks/use-cart";
import type { AuthSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { formatMonthYear } from "@/lib/i18n/format";
import AccountProfile from "./AccountProfile";
import AccountOrders from "./AccountOrders";
import AccountSettings from "./AccountSettings";
import { mockOrders } from "../_data/mockOrders";
import { checkIsAdmin } from "@/app/actions/user";

type Tab = "profile" | "orders" | "settings";

function getInitials(name: string | null | undefined, email: string): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const parts = trimmedName.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return trimmedName.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

type Props = {
  session: AuthSession;
};

export default function AccountDashboard({ session }: Props) {
  const { t, locale } = useUiPreferences();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      try {
        const adminStatus = await checkIsAdmin();
        setIsAdmin(adminStatus);
      } catch {
        setIsAdmin(false);
      }
    };

    fetchAdminStatus();
  }, []);

  const cartTotalQuantities = useCartCount();

  const user = session.user;
  const initials = getInitials(user.name, user.email);

  const memberSince = formatMonthYear(user.createdAt, locale);

  const tabs: { id: Tab; labelKey: string; icon: typeof User }[] = [
    { id: "profile", labelKey: "account.tabs.profile", icon: User },
    { id: "orders", labelKey: "account.tabs.orders", icon: Package },
    { id: "settings", labelKey: "account.tabs.settings", icon: Settings },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <div className="border border-border rounded-[20px] bg-surface-card overflow-hidden">
        {/* Top section */}
        <div className="px-6 py-6 bg-surface-section flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="shrink-0 w-16 h-16 rounded-full bg-foreground flex items-center justify-center">
            <span className="text-xl font-bold text-background">{initials}</span>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">
                {user.name || user.email}
              </h1>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                  {t("account.adminBadge")}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            {memberSince && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("account.header.memberSince")} {memberSince}
              </p>
            )}
          </div>

          {/* Sign out */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-full flex items-center gap-2 self-start sm:self-center shrink-0"
          >
            <LogOut size={14} />
            {t("account.signOut")}
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex divide-x divide-border border-t border-border">
          <div className="flex-1 px-4 py-3 text-center">
            <p className="text-xl font-bold text-foreground">{mockOrders.length}</p>
            <p className="text-xs text-muted-foreground">{t("account.header.orders")}</p>
          </div>
          <div className="flex-1 px-4 py-3 text-center">
            <p className="text-xl font-bold text-foreground">{cartTotalQuantities}</p>
            <p className="text-xs text-muted-foreground">
              {t("account.header.cartItems")}
            </p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
              activeTab === id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={15} />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "profile" && <AccountProfile session={session} />}
        {activeTab === "orders" && <AccountOrders />}
        {activeTab === "settings" && <AccountSettings />}
      </div>
    </div>
  );
}
