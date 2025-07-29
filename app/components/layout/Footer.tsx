import { Link, NavLink } from "react-router";

export function Footer() {
  return (
    <footer className="footer sm:footer-horizontal footer-center text-base-content p-4">
      <aside>
        <p className="text-gray-600 flex flex-row gap-2 items-center">
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
