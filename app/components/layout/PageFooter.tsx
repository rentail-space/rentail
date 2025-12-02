import { Link, NavLink } from "react-router";
import PageIconLink from "./PageIconLink";

const links = [
  {
    title: "Product",
    links: [
      {
        to: "/pricing",
        label: "Pricing",
      },
      {
        to: "/faq",
        label: "FAQ",
      },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        to: "/blog",
        label: "Blog",
      },
      {
        to: "/about",
        label: "About",
      },
      {
        to: "mailto:hello@rentail.space",
        label: "Contact",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      {
        to: "/privacy",
        label: "Privacy Policy",
      },
      {
        to: "/terms",
        label: "Terms of Service",
      },
    ],
  },
];

export default function PageFooter() {
  return (
    <footer className="footer sm:footer-horizontal border-t bg-gray-50 px-6 py-12 print:hidden">
      <aside className="flex flex-col gap-4 text-gray-600">
        <PageIconLink />
        <p className="text-sm">
          AI-powered short-term retail space marketplace
        </p>
        <p className="text-sm">
          © {new Date().getFullYear()} rentail.space. All rights reserved.
          Patent pending.
        </p>
        <SocialLinks />
      </aside>

      {links.map((link) => (
        <nav key={link.title}>
          <h3 className="footer-title flex flex-col gap-4">{link.title}</h3>
          {link.links.map((link) => (
            <NavLink
              aria-label={`Go to ${link.label} page`}
              className="font-medium text-gray-600 text-sm transition-colors hover:text-blue-600"
              key={link.to}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      ))}
    </footer>
  );
}

function SocialLinks() {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="https://www.linkedin.com/company/rentail-space/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-gray-600 text-sm hover:text-blue-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="mercado-match"
          width="24"
          height="24"
          focusable="false"
        >
          <title>LinkedIn</title>
          <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
        </svg>
        LinkedIn
      </Link>
    </div>
  );
}
