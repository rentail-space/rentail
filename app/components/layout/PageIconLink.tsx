import { NavLink } from "react-router";
import { twMerge } from "tailwind-merge";

export default function PageIconLink({ className }: { className?: string }) {
  return (
    <NavLink
      to="/"
      className={twMerge(
        "flex items-center gap-2 font-bold text-2xl text-gray-900",
        className,
      )}
      viewTransition
    >
      <img src="/images/logo.png" alt="rentail.space" className="h-8 w-8" />
      <span className="text-blue-600">rentail</span>.space
    </NavLink>
  );
}
