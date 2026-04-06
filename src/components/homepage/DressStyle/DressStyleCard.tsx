import { cn } from "@/lib/utils";
import Link from "next/link";

type DressStyleCardProps = {
  title: string;
  url: string;
  className?: string;
};

const DressStyleCard = ({ title, url, className }: DressStyleCardProps) => {
  return (
    <Link
      href={url}
      className={cn([
        "relative w-full md:h-full overflow-hidden rounded-[20px] bg-surface-card bg-top text-2xl md:text-4xl font-bold text-left py-4 md:py-[25px] px-6 md:px-9 bg-no-repeat bg-cover",
        className,
      ])}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/12 via-black/0 to-black/0 dark:from-black/18"
      />
      <span className="relative inline-block rounded-xl bg-background/80 px-3 py-1 text-foreground backdrop-blur-sm border border-border/50">
        {title}
      </span>
    </Link>
  );
};

export default DressStyleCard;
