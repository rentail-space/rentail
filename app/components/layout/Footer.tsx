import { Link, NavLink } from "react-router";

export default function Footer() {
  return (
    <footer className="footer sm:footer-horizontal footer-center p-4 text-base-content">
      <aside>
        <p className="flex flex-row items-center gap-2 text-gray-600">
          <span>© {new Date().getFullYear()}</span>
          <NavLink to="/" className="font-bold" viewTransition>
            <span className="text-blue-500">rentail</span>
            .space
          </NavLink>
          <span>All rights reserved</span>
          <Link
            className="text-blue-500"
            to="mailto:hello@rentail.space"
            viewTransition
          >
            Contact us
          </Link>
        </p>
      </aside>
    </footer>
  );
}
