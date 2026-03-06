"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-12 bg-white">
      <div className="w-full max-w-[520px]">
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
            Create Account
          </h1>
          <p className="text-sm text-black/50">Join IKA SUGU today</p>
        </div>

        {/* Card */}
        <div className="border border-black/10 rounded-[20px] p-7 md:p-10 bg-white shadow-sm">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            {/* First + Last name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  First name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  className="w-full px-5 py-3 bg-[#F0F0F0] rounded-full text-sm outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/15 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Last name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full px-5 py-3 bg-[#F0F0F0] rounded-full text-sm outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/15 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-5 py-3 bg-[#F0F0F0] rounded-full text-sm outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/15 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="w-full px-5 py-3 bg-[#F0F0F0] rounded-full text-sm outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/15 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="w-full px-5 py-3 bg-[#F0F0F0] rounded-full text-sm outline-none placeholder:text-black/40 focus:ring-2 focus:ring-black/15 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-black cursor-pointer shrink-0"
              />
              <span className="text-xs text-black/50 leading-relaxed">
                I agree to the{" "}
                <Link
                  href="#"
                  className="text-black font-medium hover:underline"
                >
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="text-black font-medium hover:underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-black rounded-full h-[52px] text-sm font-medium hover:bg-black/85 transition-colors"
            >
              Create Account
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <hr className="flex-1 border-t border-black/10" />
            <span className="px-4 text-xs text-black/40">or continue with</span>
            <hr className="flex-1 border-t border-black/10" />
          </div>

          {/* Social */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-black/10 rounded-full text-sm font-medium hover:bg-[#F0F0F0] transition-colors"
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          {/* Link to login */}
          <p className="text-center text-sm text-black/50 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-black font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
