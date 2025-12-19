import { NavLink } from "react-router";
import { twMerge } from "tailwind-merge";
import AccountMenu from "./AccountMenu";
import type { HeaderLink } from "./PageLayout";
import RentailIcon from "./RentailLogo";

export default function PageHeader({ links }: { links?: HeaderLink[] }) {
  return (
    <header className="flex min-h-16 w-full items-center border-black border-b-2 bg-[hsl(60,100%,99%)] p-2 print:hidden">
      <RentailIcon className="w-1/2" />

      <nav className="hidden items-center gap-6 whitespace-nowrap md:flex">
        {links?.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              twMerge(
                "whitespace-nowrap font-bold text-black text-sm",
                "transition-colors hover:text-[hsl(37,92%,65%)]",
                isActive && "text-[hsl(37,92%,65%)]",
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <AccountMenu className="w-1/2 justify-end" />
    </header>
  );
}
