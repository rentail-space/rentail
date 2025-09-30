import { useEffect } from "react";
import { Link } from "react-router";
import { authClient } from "~/lib/auth.client";

interface HeaderProps {
  chatId?: string;
}

export default function Header({ chatId }: HeaderProps) {
  useEffect(() => {
    if (!authClient.getSession()) authClient.signIn.anonymous();
  }, []);

  return (
    <header className="flex flex-row items-center justify-between gap-8 border-b px-6 py-1">
      <h1 className="font-bold text-2xl text-gray-900">
        <Link to="/">
          <span className="text-blue-600">rentail</span>.space
        </Link>
      </h1>

      {authClient && (
        <div className="flex gap-3 items-center">
          <ExportButtons chatId={chatId} />
          <Authentication />
        </div>
      )}
    </header>
  );
}

function ExportButtons({ chatId }: { chatId?: string }) {
  const { data: session, isPending } = authClient.useSession();
  return (
    !isPending &&
    session &&
    chatId && (
      <>
        <DownloadButton href={`/api/chat/${chatId}/export/csv`} as="CSV" />
        <DownloadButton href={`/api/chat/${chatId}/export/pdf`} as="PDF" />
      </>
    )
  );
}

function Authentication() {
  const { data: session, isPending } = authClient.useSession();
  return (
    !isPending &&
    (session ? (
      <button
        type="button"
        onClick={async () => {
          await authClient.signOut();
          window.location.href = "/";
        }}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
      >
        Sign Out
      </button>
    ) : (
      <Link
        to="/auth"
        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
      >
        Sign In
      </Link>
    ))
  );
}

function DownloadButton({ href, as: title }: { href: string; as: string }) {
  return (
    <a
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
      href={href}
      download
      title={`Export as ${title}`}
    >
      <DownArrowIcon />
      {title}
    </a>
  );
}

function DownArrowIcon() {
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
      <title>Export PDF</title>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
