import { Link, NavLink } from "react-router";

export default function Footer() {
  return (
    <footer className="footer sm:footer-horizontal footer-center p-4 text-base-content print:hidden">
      <aside className="flex flex-col gap-4 text-gray-600">
        <p className="flex flex-row items-center gap-2">
          <span>© {new Date().getFullYear()}</span>
          <NavLink to="/" className="font-bold" viewTransition>
            <span className="text-indigo-600 hover:underline">rentail</span>
            .space
          </NavLink>
          <span>All rights reserved</span>
          <Link
            className="text-indigo-600 hover:underline"
            to="mailto:hello@rentail.space"
            viewTransition
          >
            Contact us
          </Link>
        </p>
        <p className="flex flex-row items-center gap-2">
          <a href="/terms" className="text-indigo-600 hover:underline">
            Terms of Service
          </a>{" "}
          <a href="/privacy" className="text-indigo-600 hover:underline">
            Privacy Policy
          </a>
        </p>
      </aside>
    </footer>
  );
}
