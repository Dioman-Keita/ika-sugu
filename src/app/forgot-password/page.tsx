"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useUiPreferences } from "@/lib/ui-preferences";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { AuthNotice } from "@/components/auth/AuthNotice";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useUiPreferences();

  useEffect(() => {
    if (!isSessionPending && session) router.replace("/");
  }, [isSessionPending, router, session]);

  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-[480px]">
        {/* Heading */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className={cn(
              integralCF.className,
              "text-2xl font-bold text-foreground tracking-wide",
            )}
          >
            IKA SUGU
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-4 mb-1">
            {t("auth.forgot.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.forgot.subtitle")}</p>
        </div>

        {/* Card */}
        <div className="border border-border rounded-[20px] p-7 md:p-10 bg-surface-card shadow-sm">
          {!submitted ? (
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                if (isSubmitting) return;
                setError(null);
                setIsSubmitting(true);
                try {
                  const { error } = await authClient.requestPasswordReset({
                    email,
                    redirectTo: "/reset-password",
                  });
                  if (error) {
                    setError(error.message ?? String(error));
                    return;
                  }
                  setSubmitted(true);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("auth.emailLabel")}
                </label>
                <input
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all"
                />
              </div>

              {error ? <AuthNotice variant="error">{error}</AuthNotice> : null}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-foreground text-background rounded-full h-[52px] text-sm font-medium hover:bg-foreground/85 transition-colors"
              >
                {t("auth.forgot.submit")}
              </Button>
            </form>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-surface-section flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-foreground"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-foreground mb-2">
                {t("auth.forgot.successTitle")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("auth.forgot.successBody")}
              </p>
            </div>
          )}

          {/* Back to login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-6"
          >
            <ArrowLeft size={15} />
            {t("auth.forgot.backToSignIn")}
          </Link>
        </div>
      </div>
    </main>
  );
}
