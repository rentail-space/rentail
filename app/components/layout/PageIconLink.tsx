import { Link } from "react-router";
import { twMerge } from "tailwind-merge";

export default function PageIconLink({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={twMerge("font-bold text-2xl hover:text-blue-600", className)}
      aria-label="Go to home page"
    >
      <span className="text-blue-600">rentail</span>
      <span className="text-gray-900">.space</span>
    </Link>
  );
}
