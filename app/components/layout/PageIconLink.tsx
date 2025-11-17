import { NavLink } from "react-router";
import { twMerge } from "tailwind-merge";

export default function PageIconLink({ className }: { className?: string }) {
  return (
    <NavLink
      to="/"
      className={twMerge("font-bold text-2xl hover:text-blue-600", className)}
      viewTransition
    >
      <span className="text-blue-600">rentail</span>
      <span className="text-gray-900">.space</span>
    </NavLink>
  );
}
