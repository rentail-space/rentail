import { ShieldIcon, UnlockIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";
import { Button } from "../ui/button";

export default function AccountMenu() {
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
    <div className="navbar-end">
      {user && !user.isAnonymous ? (
        <DropdownMenu user={user} isAdmin={data.isAdmin} />
      ) : (
        <SignInButton />
      )}
    </div>
  );
}

function SignInButton() {
  return (
    <Button
      aria-label="Sign in"
      type="button"
      onClick={() => {
        window.location.href = "/auth";
      }}
      variant="ghost"
    >
      Sign In
    </Button>
  );
}

function DropdownMenu({
  user,
  isAdmin,
}: {
  isAdmin: boolean;
  user: {
    name: string | null;
    email: string | null;
  };
}) {
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
        <ul className="menu menu-dropdown dropdown-end absolute right-0 z-50 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <li className="menu-disabled border-gray-200 border-b px-4 py-2">
            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
            <p className="truncate text-gray-500 text-xs">{user.email}</p>
          </li>

          {isAdmin && (
            <li>
              <Link
                to="/admin"
                className="block w-full px-4 py-2 text-left text-gray-700 text-sm transition-colors hover:bg-gray-100"
              >
                <ShieldIcon className="mr-2 inline-block h-4 w-4" />
                Admin
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/profile"
              className="block w-full px-4 py-2 text-left text-gray-700 text-sm transition-colors hover:bg-gray-100"
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
              className="block w-full px-4 py-2 text-left text-gray-700 text-sm transition-colors hover:bg-gray-100"
            >
              <UnlockIcon className="mr-2 inline-block h-4 w-4" />
              Sign Out
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
