"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  Settings,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiPreferences } from "@/lib/ui-preferences";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { t } = useUiPreferences();

  const navLinks = [
    {
      href: "/admin/overview",
      label: t("admin.sidebar.overview"),
      icon: LayoutDashboard,
    },
    { href: "/admin/products", label: t("admin.sidebar.products"), icon: Package },
    { href: "/admin/orders", label: t("admin.sidebar.orders"), icon: ShoppingCart },
    { href: "/admin/users", label: t("admin.sidebar.users"), icon: Users },
    { href: "/admin/reviews", label: t("admin.sidebar.reviews"), icon: Star },
    { href: "/admin/settings", label: t("admin.sidebar.settings"), icon: Settings },
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface-card flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
          <Shield size={15} className="text-background" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-none">
            {t("admin.sidebar.adminPanel")}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ika Sugu</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-section",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-section transition-colors"
        >
          <ChevronLeft size={16} />
          {t("admin.sidebar.backToStore")}
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-section transition-colors"
        >
          <Settings size={16} />
          {t("admin.sidebar.accountSettings")}
        </Link>
      </div>
    </aside>
  );
}
