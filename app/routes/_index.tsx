import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
	return [
		{ title: "RenTail - Simple Rental Platform" },
		{
			name: "description",
			content: "The easiest way to rent and lend items in your community",
		},
	];
};

export default function Index() {
	return (
		<>
			{/* Hero Section */}
			<section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row items-center">
						<div className="md:w-1/2 mb-10 md:mb-0">
							<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
								Rent Anything, <br />
								<span className="text-blue-600">Anytime, Anywhere</span>
							</h1>
							<p className="text-lg md:text-xl text-gray-600 mb-8">
								The easiest way to rent and lend items in your community. Save
								money, reduce waste, and connect with locals.
							</p>
							<div className="flex flex-col sm:flex-row gap-4">
								<a
									href="#signup"
									className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
								>
									Get Started
								</a>
								<a
									href="#how-it-works"
									className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-center"
								>
									How It Works
								</a>
							</div>
						</div>
						<div className="md:w-1/2">
							<div className="relative">
								<div className="bg-white p-2 rounded-2xl shadow-xl">
									<img
										src="https://plus.unsplash.com/premium_photo-1731498609507-2ee3ce286e3b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8QSUyMGdyb3VwJTIwb2YlMjBwZW9wbGUlMjBzaGFyaW5nJTIwYW5kJTIwZXhjaGFuZ2luZyUyMGl0ZW1zfGVufDB8fDB8fHww"
										alt="A group of people sharing and exchanging items"
										className="rounded-xl w-full h-auto"
									/>
								</div>
								<div className="absolute -bottom-4 -left-4 bg-blue-600 text-white px-4 py-2 rounded-lg">
									Save up to 70% vs buying
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20" id="features">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Why Choose RenTail?
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Our platform makes renting items simple, secure, and sustainable.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<div className="p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									className="w-6 h-6"
								>
									<title>Save Money Icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold mb-2">Save Money</h3>
							<p className="text-gray-600">
								Why buy expensive items when you can rent them for a fraction of
								the cost? Save money and storage space.
							</p>
						</div>

						<div className="p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									className="w-6 h-6"
								>
									<title>Eco-Friendly Icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold mb-2">Eco-Friendly</h3>
							<p className="text-gray-600">
								Reduce waste and your carbon footprint by sharing resources
								instead of buying new items that will rarely be used.
							</p>
						</div>

						<div className="p-6 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
							<div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									className="w-6 h-6"
								>
									<title>Build Community Icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
									/>
								</svg>
							</div>
							<h3 className="text-xl font-semibold mb-2">Build Community</h3>
							<p className="text-gray-600">
								Connect with people in your neighborhood. Share resources and
								build relationships within your community.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className="py-20 bg-gray-50" id="how-it-works">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							How It Works
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Renting and lending has never been easier. Get started in just a
							few simple steps.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						<div className="text-center">
							<div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
								1
							</div>
							<h3 className="text-xl font-semibold mb-2">Sign Up</h3>
							<p className="text-gray-600">
								Create an account and verify your identity for a safe community.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
								2
							</div>
							<h3 className="text-xl font-semibold mb-2">Browse Items</h3>
							<p className="text-gray-600">
								Search for what you need or list your items for others to rent.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
								3
							</div>
							<h3 className="text-xl font-semibold mb-2">Book & Pay</h3>
							<p className="text-gray-600">
								Reserve items and make secure payments through our platform.
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
								4
							</div>
							<h3 className="text-xl font-semibold mb-2">Pickup & Return</h3>
							<p className="text-gray-600">
								Meet to exchange items or use our convenient delivery options.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section className="py-20" id="pricing">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
							Simple Pricing
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Choose the plan that works best for you
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
						<div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
							<div className="p-8">
								<h3 className="text-xl font-semibold mb-4">Basic</h3>
								<div className="flex items-baseline mb-4">
									<span className="text-4xl font-bold">Free</span>
								</div>
								<p className="text-gray-600 mb-6">
									Perfect for occasional renters
								</p>
								<ul className="space-y-3 mb-8">
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Up to 3 listings Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Up to 3 listings
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Basic search filters Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Basic search filters
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Community support Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Community support
									</li>
								</ul>
								<a
									href="#signup"
									className="block w-full py-3 px-6 text-center bg-white border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
								>
									Get Started
								</a>
							</div>
						</div>

						<div className="border-2 border-blue-600 rounded-2xl overflow-hidden shadow-lg relative">
							<div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-sm font-medium">
								Popular
							</div>
							<div className="p-8">
								<h3 className="text-xl font-semibold mb-4">Pro</h3>
								<div className="flex items-baseline mb-4">
									<span className="text-4xl font-bold">$9.99</span>
									<span className="text-gray-500 ml-1">/month</span>
								</div>
								<p className="text-gray-600 mb-6">Perfect for active renters</p>
								<ul className="space-y-3 mb-8">
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Unlimited listings Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Unlimited listings
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Advanced search options Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Advanced search options
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Priority support Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Priority support
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Featured listings Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Featured listings
									</li>
								</ul>
								<a
									href="#signup"
									className="block w-full py-3 px-6 text-center bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
								>
									Get Started
								</a>
							</div>
						</div>

						<div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
							<div className="p-8">
								<h3 className="text-xl font-semibold mb-4">Business</h3>
								<div className="flex items-baseline mb-4">
									<span className="text-4xl font-bold">$29.99</span>
									<span className="text-gray-500 ml-1">/month</span>
								</div>
								<p className="text-gray-600 mb-6">For rental businesses</p>
								<ul className="space-y-3 mb-8">
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Unlimited listings Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Unlimited listings
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Business profile Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Business profile
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>Dedicated support Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										Dedicated support
									</li>
									<li className="flex items-center">
										<svg
											className="w-5 h-5 text-green-500 mr-2"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<title>API access Icon</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										API access
									</li>
								</ul>
								<a
									href="#signup"
									className="block w-full py-3 px-6 text-center bg-white border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
								>
									Get Started
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Contact Section */}
			<section className="py-20 bg-gray-50" id="contact">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto">
						<div className="text-center mb-16">
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
								Get In Touch
							</h2>
							<p className="text-lg text-gray-600 max-w-2xl mx-auto">
								Have questions or suggestions? We&apos;d love to hear from you.
							</p>
						</div>

						<div className="bg-white p-8 rounded-2xl shadow-md">
							<form>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
									<div>
										<label
											htmlFor="name"
											className="block text-gray-700 font-medium mb-2"
										>
											Name
										</label>
										<input
											type="text"
											id="name"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
											placeholder="Your name"
										/>
									</div>
									<div>
										<label
											htmlFor="email"
											className="block text-gray-700 font-medium mb-2"
										>
											Email
										</label>
										<input
											type="email"
											id="email"
											className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
											placeholder="Your email"
										/>
									</div>
								</div>
								<div className="mb-6">
									<label
										htmlFor="subject"
										className="block text-gray-700 font-medium mb-2"
									>
										Subject
									</label>
									<input
										type="text"
										id="subject"
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
										placeholder="Subject"
									/>
								</div>
								<div className="mb-6">
									<label
										htmlFor="message"
										className="block text-gray-700 font-medium mb-2"
									>
										Message
									</label>
									<textarea
										id="message"
										rows={4}
										className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
										placeholder="Your message"
									/>
								</div>
								<button
									type="submit"
									className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
								>
									Send Message
								</button>
							</form>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
