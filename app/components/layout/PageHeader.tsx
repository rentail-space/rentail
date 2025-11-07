import { NavLink } from "react-router";
import AccountMenu from "./AccountMenu";

export default function PageHeader() {
  return (
    <header className="flex flex-row items-center justify-between gap-8 border-b bg-white px-6 py-4 print:hidden">
      <NavLink to="/" className="font-bold text-2xl text-gray-900">
        <span className="text-blue-600">rentail</span>.space
      </NavLink>

      <nav className="hidden items-center gap-6 md:flex">
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
