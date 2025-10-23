import { IconDownload, IconUser } from "obra-icons-react";
import type { ChatGetPayload } from "prisma/generated/models";
import { useEffect, useRef, useState } from "react";
import { Link, useRouteLoaderData } from "react-router";
import authClient from "~/lib/auth.client";

export default function Header() {
  return (
    <header className="flex flex-row items-center justify-between gap-8 border-b px-6 py-1 print:hidden">
      <Link to="/" className="font-bold text-2xl text-gray-900">
        <span className="text-blue-600">rentail</span>.space
      </Link>

      <UserMenu />
    </header>
  );
}

function UserMenu() {
  const data = useRouteLoaderData<{
    chat: ChatGetPayload<{ include: { user: true } }>;
  }>("root");
  const chat = data?.chat;
  const user = chat?.user;
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
  return user && !user.isAnonymous ? (
    <DropdownMenu chat={chat} />
  ) : (
    <SignInButton />
  );
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
  chat,
}: {
  chat: ChatGetPayload<{ include: { user: true } }>;
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
        <IconUser />
        <span>{chat.user.name || chat.user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">
              {chat.user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{chat.user.email}</p>
          </div>

          <Link
            to="/profile"
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <IconUser className="w-4 h-4 inline-block mr-2" />
            Profile Settings
          </Link>

          <a
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            download
            href={`/api/chat/${chat.id}/export/csv`}
          >
            <IconDownload className="w-4 h-4 inline-block mr-2" />
            CSV Export
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
