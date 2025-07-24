export default function SpecialtyLeasing() {
  return (
    <section className="flex flex-row gap-2 max-w-screen-lg mx-auto items-start">
      <LightBulb />
      <div className="prose prose-lg flex-1">
        <h2>Specialty Leasing</h2>
        <p>
          Specialty leasing refers to short-term retail space in malls, shopping
          centers, and other retail centers. It includes flexible options like
          RMUs (Retail Merchandising Units), retail carts, booth rentals, kiosk
          spaces, and pop-up shops. These options allow businesses to test new
          concepts while adding variety to the consumer experience.
        </p>
      </div>
    </section>
  );
}

function LightBulb() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-10 h-10 text-yellow-500 flex-shrink-0"
      aria-hidden="true"
    >
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}
