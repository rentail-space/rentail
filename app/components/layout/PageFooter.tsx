import { NavLink } from "react-router";
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
      <aside className="flex flex-col gap-4">
        <PageIconLink />
        <p className="text-gray-600 text-sm">
          AI-powered short-term retail space marketplace
        </p>
        <p className="text-gray-600 text-sm">
          © {new Date().getFullYear()} rentail.space. All rights reserved.
        </p>
      </aside>

      {links.map((link) => (
        <nav key={link.title}>
          <h3 className="footer-title flex flex-col gap-4">{link.title}</h3>
          {link.links.map((link) => (
            <NavLink
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
