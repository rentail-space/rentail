import type { UserWithAnonymous } from "better-auth/plugins";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import authClient from "~/lib/auth.client";

export default function Header({ chatId }: { chatId?: string }) {
  return (
    <header className="flex flex-row items-center justify-between gap-8 border-b px-6 py-1">
      <Link to="/" className="font-bold text-2xl text-gray-900">
        <span className="text-blue-600">rentail</span>.space
      </Link>

      <ClientOnly>
        <UserMenu chatId={chatId} />
      </ClientOnly>
    </header>
  );
}

import { useIsClient, useTimeout } from "usehooks-ts";

function ClientOnly({ children }: { children: React.ReactNode }) {
  // NOTE: do not call useSession() while server-side rendering
  const isClient = useIsClient();
  return isClient ? children : null;
}

function UserMenu({ chatId }: { chatId?: string }) {
  const { data: session, isPending, refetch } = authClient.useSession();
  const user = session?.user as UserWithAnonymous | null;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // NOTE: after user signs in, the header doesn't show them as signed in, we
  // need to refetch the session to show them as signed in
  useTimeout(refetch, 100);

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
  if (isPending) return <span>Loading...</span>;
  else if (user && !user.isAnonymous)
    return <DropdownMenu user={user} chatId={chatId} />;
  else return <SignInButton />;
}

function SignInButton() {
  return (
    <button
      aria-label="Sign in"
      type="button"
      onClick={() => {
        window.location.href = "/auth";
      }}
      className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
    >
      Sign In
    </button>
  );
}

function DropdownMenu({
  chatId,
  user,
}: {
  chatId?: string;
  user: UserWithAnonymous;
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
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <UserIcon />
        <span>{user.name || user.email}</span>
        <ChevronDownIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <Link
            to="/profile"
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Profile Settings
          </Link>

          <a
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            download
            href={`/api/chat/${chatId}/export/csv`}
          >
            CSV Export
          </a>
          <a
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            download
            href={`/api/chat/${chatId}/export/pdf`}
          >
            PDF Export
          </a>

          <button
            type="button"
            onClick={async () => {
              await authClient.signOut();
              window.location.href = "/";
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>User</title>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronDownIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
    >
      <title>Menu</title>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
