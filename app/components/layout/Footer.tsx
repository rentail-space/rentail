import { Link, NavLink } from "react-router";

export function Footer() {
  return (
    <footer>
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-600 space-x-2">
          <span>© {new Date().getFullYear()}</span>
          <NavLink to="/" className="font-bold" viewTransition>
            <span className="text-blue-500">rentail</span>
            .space
          </NavLink>
          <span>All rights reserved</span>
          <Link
            to="mailto:info@rentail.space"
            className="text-blue-500"
            viewTransition
          >
            Contact us
          </Link>
        </p>
      </div>
    </footer>
  );
}
