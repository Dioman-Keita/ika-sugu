"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useUiPreferences } from "@/lib/ui-preferences";
import { authClient } from "@/lib/auth-client";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { getSafeNext } from "@/lib/safe-next";

export default function LoginClient({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = getSafeNext(searchParams.get("next")) ?? "/";
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useUiPreferences();

  useEffect(() => {
    if (!isSessionPending && session) router.replace(safeNext);
  }, [isSessionPending, router, safeNext, session]);

  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-120">
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
            {t("auth.login.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("auth.login.subtitle")}</p>
        </div>

        {/* Card */}
        <div className="border border-border rounded-[20px] p-7 md:p-10 bg-surface-card shadow-sm">
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (isSubmitting) return;
              setError(null);
              setIsSubmitting(true);
              try {
                const { data, error } = await authClient.signIn.email({
                  email,
                  password,
                  rememberMe: true,
                });
                if (error) {
                  setError(error.message ?? String(error));
                  return;
                }
                if (data?.redirect && data.url) {
                  window.location.href = data.url;
                  return;
                }
                router.push(safeNext);
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  {t("auth.passwordLabel")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-3 bg-surface-section text-foreground rounded-full text-sm outline-none placeholder:text-foreground/40 focus:ring-2 focus:ring-foreground/15 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                  aria-label={t("auth.togglePasswordVisibility")}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error ? <AuthNotice variant="error">{error}</AuthNotice> : null}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-foreground text-background rounded-full h-13 text-sm font-medium hover:bg-foreground/85 transition-colors mt-2"
            >
              {t("auth.login.submit")}
            </Button>
          </form>

          {googleEnabled ? (
            <>
              {/* Divider */}
              <div className="flex items-center my-6">
                <hr className="flex-1 border-t border-border" />
                <span className="px-4 text-xs text-muted-foreground">
                  {t("auth.orContinueWith")}
                </span>
                <hr className="flex-1 border-t border-border" />
              </div>

              {/* Social */}
              <button
                type="button"
                onClick={async () => {
                  if (isSubmitting) return;
                  setError(null);
                  setIsSubmitting(true);
                  try {
                    const { data, error } = await authClient.signIn.social({
                      provider: "google",
                    });
                    if (error) {
                      setError(error.message ?? String(error));
                      return;
                    }
                    if (data?.url) {
                      window.location.href = data.url;
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-full text-sm font-medium text-foreground hover:bg-surface-section transition-colors"
              >
                <FcGoogle size={20} />
                {t("auth.continueWithGoogle")}
              </button>
            </>
          ) : null}

          {/* Link to register */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {t("auth.login.noAccount")}{" "}
            <Link
              href="/register"
              className="text-foreground font-semibold hover:underline"
            >
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
