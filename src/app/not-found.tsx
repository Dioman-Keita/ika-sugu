import Link from "next/link";
import { cn } from "@/lib/utils";
import { integralCF } from "@/styles/fonts";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-220px)] flex items-center justify-center px-4 py-20 bg-white">
      <div className="text-center">
        {/* Large 404 */}
        <h1
          className={cn(
            integralCF.className,
            "text-[100px] xs:text-[130px] md:text-[160px] leading-none font-bold text-black select-none"
          )}
        >
          404
        </h1>

        {/* Divider accent */}
        <div className="w-16 h-1 bg-black rounded-full mx-auto my-6" />

        {/* Title */}
        <h2
          className={cn(
            integralCF.className,
            "text-xl md:text-2xl font-bold text-black mb-4"
          )}
        >
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-sm md:text-base text-black/50 max-w-[360px] mx-auto mb-10 leading-relaxed">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>

        {/* CTA */}
        <Button
          asChild
          className="bg-black rounded-full h-[52px] px-10 text-sm font-medium hover:bg-black/85 transition-colors"
        >
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
