export default function HeroSection({
  howItWorksId,
}: {
  howItWorksId: string;
}) {
  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find your <span className="text-blue-600">short-term rental</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              We help you find a short-term rental that fits your needs, in a
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
