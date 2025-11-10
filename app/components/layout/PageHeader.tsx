import { NavLink } from "react-router";
import AccountMenu from "./AccountMenu";
import PageIconLink from "./PageIconLink";

export default function PageHeader() {
  return (
    <header className="navbar shadow-sm print:hidden">
      <PageIconLink className="navbar-start" />

      <nav className="navbar-center hidden items-center gap-6 md:flex">
        <NavLink
          to="/about"
          className="font-medium text-gray-600 text-sm transition-colors hover:text-blue-600"
        >
          About
        </NavLink>
        <NavLink
          to="/pricing"
          className="font-medium text-gray-600 text-sm transition-colors hover:text-blue-600"
        >
          Pricing
        </NavLink>
        <NavLink
          to="/blog"
          className="font-medium text-gray-600 text-sm transition-colors hover:text-blue-600"
        >
          Blog
        </NavLink>
        <NavLink
          to="/faq"
          className="font-medium text-gray-600 text-sm transition-colors hover:text-blue-600"
        >
          FAQ
        </NavLink>
        <NavLink
          to="mailto:hello@rentail.space"
          className="font-medium text-gray-600 text-sm transition-colors hover:text-blue-600"
        >
          Contact
        </NavLink>
      </nav>
      <AccountMenu />
    </header>
  );
}
