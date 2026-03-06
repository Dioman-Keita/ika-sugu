"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-[480px]">
        {/* Heading */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className={cn(
              integralCF.className,
              "text-2xl font-bold text-black tracking-wide"
            )}
          >
            IKA SUGU
          </Link>
          <h1 className="text-2xl font-bold text-black mt-4 mb-1">
            Forgot Password?
          </h1>
          <p className="text-sm text-black/50">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {/* Card */}
        <div className="border border-black/10 rounded-[20px] p-7 md:p-10 bg-white shadow-sm">
          {!submitted ? (
            <form
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full px-5 py-3 bg-[#F0F0F0] rounded-full text-sm outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/15 transition-all"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-black rounded-full h-[52px] text-sm font-medium hover:bg-black/85 transition-colors"
              >
                Send Reset Link
              </Button>
            </form>
          ) : (
            /* Success state */
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#F0F0F0] flex items-center justify-center mx-auto mb-4">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-black mb-2">
                Check your inbox
              </h2>
              <p className="text-sm text-black/50 leading-relaxed">
                If an account exists for that email address, you&apos;ll receive
                a password reset link shortly.
              </p>
            </div>
          )}

          {/* Back to login */}
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-black/50 hover:text-black transition-colors mt-6"
          >
            <ArrowLeft size={15} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
