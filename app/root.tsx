import {
	Links,
	type LinksFunction,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "react-router";
import "./app.css";

export const links: LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
];

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<Footer />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

function Footer() {
	return (
		<footer>
			<div className="container mx-auto p-4 text-center">
				<p className="text-gray-600">
					© {new Date().getFullYear()} rentail.space. All rights reserved.
				</p>
			</div>
		</footer>
	);
}

export default function App() {
	return <Outlet />;
}
