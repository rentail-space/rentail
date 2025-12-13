import { Link } from "react-router";
import { twMerge } from "tailwind-merge";

export default function RentailLogo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={twMerge(
        "flex flex-nowrap items-center",
        "font-bold text-2xl leading-none",
        "transition-colors hover:text-[hsl(37,92%,65%)]",
        className,
      )}
      aria-label="Go to home page"
    >
      <img
        alt="rentail.space"
        className="mt-1 mr-1"
        height={24}
        src="/images/logo.png"
        width={24}
      />
      <span className="text-[hsl(37,92%,65%)]">rentail</span>
      <span className="text-black">.space</span>
    </Link>
  );
}
