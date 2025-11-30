import { NavLink } from "react-router";
import { twMerge } from "tailwind-merge";
import AccountMenu from "./AccountMenu";
import PageIconLink from "./PageIconLink";
import type { HeaderLink } from "./PageLayout";

export default function PageHeader({ links }: { links?: HeaderLink[] }) {
  return (
    <header className="navbar mb-1 shadow-sm print:hidden">
      <PageIconLink className="navbar-start" />

      <nav className="navbar-center hidden items-center gap-6 md:flex">
        {links?.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              twMerge(
                "font-medium text-gray-600 text-sm transition-colors hover:text-blue-600",
                isActive && "text-blue-600",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <AccountMenu className="navbar-end" />
    </header>
  );
}
