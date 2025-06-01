import type { LinksFunction } from "@remix-run/node";
import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from "@remix-run/react";

import "./tailwind.css";

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
			<body className="bg-white min-h-screen flex flex-col">
				{children}
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

const appName = "rentail.space";
const tagline = "Find your speciality lease with ease";

export default function App() {
	return (
		<>
			<Header />
			<main className="flex-grow">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}

function Header() {
	return (
		<header className="py-4 border-b border-gray-200">
			<div className="container mx-auto px-4 flex justify-between items-center">
				<div className="flex items-center">
					<a href="/" className="text-2xl font-bold text-blue-600">
						{appName}
					</a>
				</div>
				<nav className="hidden md:flex space-x-8">
					<a
						href="#features"
						className="font-medium text-gray-600 hover:text-blue-600"
					>
						Features
					</a>
					<a
						href="#how-it-works"
						className="font-medium text-gray-600 hover:text-blue-600"
					>
						How It Works
					</a>
					<a
						href="mailto:help@rentail.space"
						className="font-medium text-gray-600 hover:text-blue-600"
					>
						Contact
					</a>
				</nav>
				<div className="hidden md:flex items-center space-x-4">
					<a
						href="#login"
						className="px-4 py-2 rounded font-medium text-blue-600 hover:text-blue-800"
					>
						Sign in
					</a>
					<a
						href="#signup"
						className="px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700"
					>
						Get Started
					</a>
				</div>
			</div>
		</header>
	);
}

function Footer() {
	return (
		<footer className="bg-gray-100 py-12">
			<div className="container mx-auto px-4">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					<div>
						<h3 className="text-lg font-semibold mb-4">{appName}</h3>
						<p className="text-gray-600">{tagline}</p>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-4">Company</h3>
						<ul className="space-y-2">
							<li>
								<a href="#about" className="text-gray-600 hover:text-blue-600">
									About Us
								</a>
							</li>
							<li>
								<a
									href="#careers"
									className="text-gray-600 hover:text-blue-600"
								>
									Careers
								</a>
							</li>
							<li>
								<a href="#blog" className="text-gray-600 hover:text-blue-600">
									Blog
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-4">Resources</h3>
						<ul className="space-y-2">
							<li>
								<a href="#help" className="text-gray-600 hover:text-blue-600">
									Help Center
								</a>
							</li>
							<li>
								<a href="#faq" className="text-gray-600 hover:text-blue-600">
									FAQ
								</a>
							</li>
							<li>
								<a
									href="#support"
									className="text-gray-600 hover:text-blue-600"
								>
									Support
								</a>
							</li>
						</ul>
					</div>
					<div>
						<h3 className="text-lg font-semibold mb-4">Legal</h3>
						<ul className="space-y-2">
							<li>
								<a href="#terms" className="text-gray-600 hover:text-blue-600">
									Terms of Service
								</a>
							</li>
							<li>
								<a
									href="#privacy"
									className="text-gray-600 hover:text-blue-600"
								>
									Privacy Policy
								</a>
							</li>
							<li>
								<a
									href="#cookies"
									className="text-gray-600 hover:text-blue-600"
								>
									Cookie Policy
								</a>
							</li>
						</ul>
					</div>
				</div>
				<div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500">
					<p>
						© {new Date().getFullYear()} {appName}. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
}
