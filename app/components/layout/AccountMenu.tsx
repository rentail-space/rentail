import { ShieldIcon, UnlockIcon, UserIcon } from "lucide-react";
import type { User } from "prisma/generated/client";
import { useEffect, useRef, useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import { Button } from "~/components/ui/Button";
import type { loader as rootLoader } from "~/root";

export default function AccountMenu({ className }: { className?: string }) {
  const data = useRouteLoaderData<typeof rootLoader>("root");
  const user = data?.user;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      )
        setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Show sign-in link for non-authenticated users
  return (
    <div className={className}>
      {user && !user.isAnonymous ? (
        <DropdownMenu user={user} />
      ) : (
        <SignInButton />
      )}
    </div>
  );
}

function SignInButton() {
  return (
    <Link
      aria-label="Go to sign in page"
      className="h-9 w-22 transform whitespace-nowrap rounded-[5px] border-2 border-black bg-[hsl(37,92%,65%)] px-4 py-1 font-bold text-black shadow-[2px_2px_0px_0px_black] transition-all duration-100 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_black]"
      to="/auth"
    >
      Sign In
    </Link>
  );
}

function DropdownMenu({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        variant="ghost"
      >
        <UserIcon className="h-4 w-4" />
        <span className="max-w-[200px] truncate">
          {user.name || user.email}
        </span>
      </Button>

      {isOpen && (
        <menu className="menu menu-dropdown dropdown-end absolute top-8 right-0 z-50 mt-2 w-48 rounded-[5px] border-2 border-black bg-white py-1 shadow-[4px_4px_0px_0px_black]">
          <li className="menu-disabled border-black border-b-2 px-4 py-2">
            <p className="font-bold text-black text-sm">{user.name}</p>
            <p className="truncate font-medium text-black text-xs">
              {user.email}
            </p>
          </li>

          {user.isAdmin && (
            <li>
              <Link
                to="/admin"
                className="block w-full px-4 py-2 text-left font-medium text-black text-sm transition-colors hover:bg-[hsl(47,100%,95%)] hover:text-[hsl(37,92%,65%)]"
              >
                <ShieldIcon className="mr-2 inline-block h-4 w-4" />
                Admin
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/profile"
              className="block w-full px-4 py-2 text-left font-medium text-black text-sm transition-colors hover:bg-[hsl(47,100%,95%)] hover:text-[hsl(37,92%,65%)]"
            >
              <UserIcon className="mr-2 inline-block h-4 w-4" />
              Profile Settings
            </Link>
          </li>

          <li>
            <button
              type="button"
              onClick={async () => {
                window.location.href = "/auth/sign-out";
              }}
              className="block w-full px-4 py-2 text-left font-medium text-black text-sm transition-colors hover:bg-[hsl(47,100%,95%)] hover:text-[hsl(37,92%,65%)]"
            >
              <UnlockIcon className="mr-2 inline-block h-4 w-4" />
              Sign Out
            </button>
          </li>
        </menu>
      )}
    </div>
  );
}
