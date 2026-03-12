"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUiPreferences } from "@/lib/ui-preferences";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const router = useRouter();
  const { t } = useUiPreferences();
  const { data: session, isPending } = authClient.useSession();

  return (
    <main className="min-h-[calc(100vh-220px)] px-4 py-12 bg-background">
      <div className="max-w-frame mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">{t("account.title")}</h1>

        {isPending ? (
          <p className="text-muted-foreground text-sm">{t("account.loading")}</p>
        ) : session ? (
          <div className="border border-border rounded-[20px] p-6 bg-surface-card">
            <p className="text-sm text-muted-foreground">
              {t("account.signedInAs")}{" "}
              <span className="text-foreground font-medium">
                {session.user?.email ?? session.user?.name ?? session.user?.id}
              </span>
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                className="rounded-full"
                onClick={async () => {
                  await authClient.signOut();
                  router.push("/");
                  router.refresh();
                }}
              >
                {t("account.signOut")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-[20px] p-6 bg-surface-card">
            <p className="text-sm text-muted-foreground">{t("account.signedOut")}</p>
            <div className="mt-6">
              <Button asChild className="rounded-full">
                <Link href="/login">{t("account.goToLogin")}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
