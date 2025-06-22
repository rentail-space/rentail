import { useId } from "react";
import { NavLink } from "react-router";

export default function () {
  const howItWorksId = useId();
  return (
    <>
      <main className="flex flex-col min-h-screen">
        <HeroSection howItWorksId={howItWorksId} />
        <FeaturesSection />
        <HowItWorksSection howItWorksId={howItWorksId} />
      </main>
      <Footer />
    </>
  );
}

function HeroSection({ howItWorksId }: { howItWorksId: string }) {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find your <span className="text-blue-600">speciality lease</span>{" "}
              with ease
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              We help you find a speciality lease that fits your needs, in a
              shopping center near you, at reasonable price, and with adequate
              foot traffic to make your business thrive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#signup"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Get Started
              </a>
              <a
                href={`#${howItWorksId}`}
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
                Rent a space for a few days, weeks, or months
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose <span className="text-blue-600">rentail</span>.space?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our marketplace makes renting a space quick and simple.
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
            <h3 className="text-xl font-semibold mb-2">
              Find the Perfect Space
            </h3>
            <p className="text-gray-600">
              We help you find a speciality lease that fits your needs, with
              adequate foot traffic to make your business thrive.
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
            <h3 className="text-xl font-semibold mb-2">Sign Up Once</h3>
            <p className="text-gray-600">
              You only need to sign up once to access all shopping center in
              your area. We give you the flexibility to try out different
              markets.
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
            <h3 className="text-xl font-semibold mb-2">
              We Handle the Minutia
            </h3>
            <p className="text-gray-600">
              We take care of the details so you can focus on your business,
              from payment processing to contract management.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({ howItWorksId }: { howItWorksId: string }) {
  return (
    <section className="py-20 bg-gray-50" id={howItWorksId}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Leasing a speciality space is simple and straightforward with just a
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
              Create an account and verify your business identity.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Find a Space</h3>
            <p className="text-gray-600">
              Chat away to find the perfect space for your business needs.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Book & Pay</h3>
            <p className="text-gray-600">
              Schedule the lease period, confirm details, and pay securely.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              4
            </div>
            <h3 className="text-xl font-semibold mb-2">Show & Sell</h3>
            <p className="text-gray-600">
              Show up at the space, set up your business, and start selling!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container mx-auto p-4 text-center">
        <p className="text-gray-600 space-x-2">
          <span>© {new Date().getFullYear()}</span>
          <NavLink to="/" className="font-bold" viewTransition>
            <span className="text-blue-500">rentail</span>
            .space
          </NavLink>
          <NavLink to="/demo" viewTransition>
            All rights reserved.
          </NavLink>
        </p>
      </div>
    </footer>
  );
}
