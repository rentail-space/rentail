import { NavLink } from "react-router";
import { twMerge } from "tailwind-merge";
import AccountMenu from "./AccountMenu";
import PageIconLink from "./PageIconLink";
import type { HeaderLink } from "./PageLayout";

export default function PageHeader({ links }: { links?: HeaderLink[] }) {
  return (
    <header className="mb-1 flex min-h-16 w-full items-center border-black border-b-2 bg-[hsl(60,100%,99%)] p-2 print:hidden">
      <PageIconLink className="inline-flex w-1/2 items-center justify-start" />

      <nav className="hidden items-center gap-6 whitespace-nowrap md:flex">
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

      <AccountMenu className="inline-flex w-1/2 items-center justify-end" />
    </header>
  );
}
