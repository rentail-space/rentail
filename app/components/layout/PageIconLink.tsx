import { Link } from "react-router";
import { twMerge } from "tailwind-merge";

export default function PageIconLink({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={twMerge(
        "flex flex-nowrap items-center gap-2 font-bold text-2xl hover:text-blue-600",
        className,
      )}
      aria-label="Go to home page"
    >
      <img src="/images/logo.png" alt="rentail.space" width={24} height={24} />
      <div className="flex flex-row flex-nowrap">
        <span className="text-blue-600">rentail</span>
        <span className="text-gray-900">.space</span>
      </div>
    </Link>
  );
}
