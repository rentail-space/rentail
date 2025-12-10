import { NavLink } from "react-router";
import { twMerge } from "tailwind-merge";
import AccountMenu from "./AccountMenu";
import PageIconLink from "./PageIconLink";
import type { HeaderLink } from "./PageLayout";

export default function PageHeader({ links }: { links?: HeaderLink[] }) {
  return (
    <header className="navbar mb-1 border-black border-b-2 bg-[hsl(60,100%,99%)] print:hidden">
      <PageIconLink className="navbar-start" />

      <nav className="navbar-center hidden items-center gap-6 md:flex">
        {links?.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              twMerge(
                "font-bold text-black text-sm transition-colors hover:text-[hsl(37,92%,65%)]",
                isActive && "text-[hsl(37,92%,65%)]",
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
