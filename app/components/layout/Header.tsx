import { Link } from "react-router";

export default function Header() {
  return (
    <header className="border-b px-6 py-1 flex flex-row gap-8 items-center justify-between">
      <h1 className="text-2xl font-bold text-gray-900">
        <Link to="/">
          <span className="text-blue-600">rentail</span>.space
        </Link>
      </h1>
    </header>
  );
}
