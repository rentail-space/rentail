import { NavLink } from "react-router";
import AccountMenu from "./AccountMenu";
import PageIconLink from "./PageIconLink";

const links = [
  {
    to: "/about",
    label: "About",
  },
  {
    to: "/pricing",
    label: "Pricing",
  },
  {
    to: "/blog",
    label: "Blog",
  },
  {
    to: "/faq",
    label: "FAQ",
  },
];

export default function PageHeader() {
  return (
    <header className="navbar shadow-sm print:hidden">
      <PageIconLink className="navbar-start" />

      <nav className="navbar-center hidden items-center gap-6 md:flex">
        {links.map((link) => (
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
