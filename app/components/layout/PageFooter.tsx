import { NavLink } from "react-router";

export default function PageFooter() {
  return (
    <footer className="border-t bg-gray-50 px-6 py-12 print:hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <NavLink to="/" className="font-bold text-2xl" viewTransition>
              <span className="text-blue-600">rentail</span>.space
            </NavLink>
            <p className="text-gray-600 text-sm">
              AI-powered short-term retail space marketplace
            </p>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">Product</h3>
            <nav className="flex flex-col gap-2">
              <NavLink
                to="/pricing"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Pricing
              </NavLink>
              <NavLink
                to="/faq"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                FAQ
              </NavLink>
            </nav>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">Resources</h3>
            <nav className="flex flex-col gap-2">
              <NavLink
                to="/blog"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Blog
              </NavLink>
              <NavLink
                to="/about"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                About
              </NavLink>
              <NavLink
                to="mailto:hello@rentail.space"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Contact
              </NavLink>
            </nav>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-gray-900 text-sm">Legal</h3>
            <nav className="flex flex-col gap-2">
              <NavLink
                to="/privacy"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Privacy Policy
              </NavLink>
              <NavLink
                to="/terms"
                className="text-gray-600 text-sm transition-colors hover:text-blue-600"
              >
                Terms of Service
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} rentail.space. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
