"use client";

import { Mail, User, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiPreferences } from "@/lib/ui-preferences";
import type { AuthSession } from "@/lib/auth";

type Props = {
  session: AuthSession;
};

export default function AccountProfile({ session }: Props) {
  const { t, locale } = useUiPreferences();
  const user = session.user;

  const memberSinceDate = user.createdAt
    ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(user.createdAt))
    : "—";

  const fields = [
    {
      icon: User,
      label: t("account.profile.name"),
      value: user.name || "—",
    },
    {
      icon: Mail,
      label: t("account.profile.email"),
      value: user.email,
    },
    {
      icon: Calendar,
      label: t("account.header.memberSince"),
      value: memberSinceDate,
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">
        {t("account.profile.title")}
      </h2>

      {/* Info card */}
      <div className="border border-border rounded-[20px] bg-surface-card divide-y divide-border overflow-hidden">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-surface-section flex items-center justify-center">
              <Icon size={14} className="text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium text-foreground truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="rounded-full text-sm flex items-center gap-2"
          onClick={() => {}}
        >
          <Lock size={14} />
          {t("account.profile.changePassword")}
        </Button>
      </div>
    </div>
  );
}
