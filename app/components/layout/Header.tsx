import { Link } from "react-router";

export default function Header() {
  return (
    <header className="flex flex-row items-center justify-between gap-8 border-b px-6 py-1">
      <h1 className="font-bold text-2xl text-gray-900">
        <Link to="/">
          <span className="text-blue-600">rentail</span>.space
        </Link>
      </h1>
    </header>
  );
}
