import { NavLink } from "react-router";
import AccountMenu from "./AccountMenu";
import PageIconLink from "./PageIconLink";

export default function PageHeader({
  children,
  links,
}: {
  children?: React.ReactNode;
  links?: {
    to: string;
    label: string;
  }[];
}) {
  return (
    <header className="navbar shadow-sm print:hidden">
      <PageIconLink className="navbar-start" />
      {children}

      <nav className="navbar-center hidden items-center gap-6 md:flex">
        {links?.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className="font-medium text-gray-600 text-sm transition-colors hover:text-blue-600"
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <AccountMenu />
    </header>
  );
}
