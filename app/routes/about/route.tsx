import AboutCTA from "./AboutCTA";
import AboutHeader from "./AboutHeader";
import AboutMission from "./AboutMission";
import AboutStory from "./AboutStory";
import AboutTeam from "./AboutTeam";
import AboutValues from "./AboutValues";

export default function About() {
  return (
    <main
      className="flex min-h-screen flex-col bg-[hsl(60,100%,99%)]"
      aria-label="About page"
    >
      <title>
        About Rentail.space - Making retail space accessible for everyone
      </title>
      <meta
        name="description"
        content="Rentail.space helps micro-merchants find affordable, flexible retail space—making brick-and-mortar accessible to everyone."
      />
      <meta
        name="keywords"
        content="about rentail.space, retail space, micro-merchants, brick-and-mortar, democratize retail space"
      />
      <meta
        property="og:title"
        content="About Rentail.space - Making retail space accessible for everyone"
      />
      <meta
        property="og:description"
        content="Rentail.space helps micro-merchants find affordable, flexible retail space—making brick-and-mortar accessible to everyone."
      />
      <meta
        property="og:image"
        content="https://rentail.space/images/og-image.png"
      />
      <meta property="og:url" content="https://rentail.space/about" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Rentail.space" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta
        name="twitter:title"
        content="About Rentail.space - Making retail space accessible for everyone"
      />
      <meta
        name="twitter:description"
        content="Rentail.space helps micro-merchants find affordable, flexible retail space—making brick-and-mortar accessible to everyone."
      />
      <meta
        name="twitter:image"
        content="https://rentail.space/images/og-image.png"
      />
      <link rel="canonical" href="https://rentail.space/about" />

      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Server-generated structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaData()),
        }}
      />

      <div className="container mx-auto my-10 space-y-8 p-5">
        <AboutHeader />
        <AboutStory />
        <AboutValues />
        <AboutTeam />
        <AboutMission />
      </div>
      <AboutCTA />
    </main>
  );
}

function schemaData() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Rentail.space",
    description:
      "Learn about Rentail.space, the marketplace making retail space accessible for everyone through specialty leasing and short-term retail opportunities",
    url: "https://rentail.space/about",
    mainEntity: {
      "@type": "Organization",
      "@id": "https://rentail.space#organization",
      name: "Rentail.space",
      alternateName: "Rentail",
      description:
        "Marketplace for specialty leasing and short-term retail spaces in US shopping centers",
      url: "https://rentail.space",
      foundingDate: "2024",
      founder: {
        "@type": "Person",
        name: "Assaf Arkin",
        jobTitle: "CEO",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Los Angeles",
        addressRegion: "CA",
        addressCountry: "US",
      },
      email: "hello@rentail.space",
      sameAs: ["https://www.linkedin.com/company/rentail-space"],
      knowsAbout: [
        "Specialty Leasing",
        "Short-term Retail Leasing",
        "Mall Kiosks",
        "Pop-up Shops",
        "Temporary Retail Spaces",
      ],
    },
  };
}
