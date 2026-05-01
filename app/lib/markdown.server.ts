import type { PropertyGetPayload } from "prisma/generated/models";
import { recentBlogPosts, loadBlogPost } from "~/lib/blogPosts.server";
import { recentNewsItems, loadNewsItem } from "~/lib/newsItems.server";
import forAIAssistants from "~/data/for-ai-assistants.md?raw";
import privacy from "~/data/privacy.md?raw";
import terms from "~/data/terms.md?raw";
import prisma from "~/lib/prisma.server";
import { formatDateHuge } from "~/lib/temporal";
import faq from "~/routes/faq/faq";
import glossary from "~/routes/glossary/glossary";

const CENTER_CARD = (
  c: PropertyGetPayload<{
    include: { spaces: true; state: true };
  }>,
) => {
  const parts = [`### [${c.name}](/center/${c.id})`];
  if (c.summary) parts.push(c.summary);
  const stats: string[] = [];
  if (c.numberOfStores && c.numberOfStores >= 30)
    stats.push(`${c.numberOfStores.toLocaleString()} stores`);
  if (c.squareFootage && c.squareFootage >= 10_0000)
    stats.push(`${c.squareFootage.toLocaleString()} sq ft`);
  if (c.spaces.length > 0)
    stats.push(
      `${c.spaces.length} available space${c.spaces.length !== 1 ? "s" : ""}`,
    );
  if (stats.length > 0) parts.push(`> ${stats.join(" · ")}`);
  return parts.join("\n\n");
};

export function renderIndex(
  posts: Awaited<ReturnType<typeof recentBlogPosts>>,
) {
  const blogSection =
    posts.length > 0
      ? `\n## Recent Blog Posts\n\n${posts.map((p) => `- [${p.title}](/blog/${p.slug})`).join("\n")}`
      : "";

  return {
    body: `# Rentail.space — Specialty Leasing & Short-Term Retail Spaces

Rentail.space is the nation's premier AI-powered specialty lease marketplace, connecting businesses with short-term retail spaces in shopping centers across the United States and Canada.

## Features

- **AI-Powered Matching** — Find the perfect space for your business concept
- **No Broker Fees** — Direct connections with property managers
- **Transparent Pricing** — Clear terms and competitive rates
- **Nationwide Coverage** — Shopping centers across the US and Canada

## Services

- **Kiosk Rental** — Standalone retail structures in shopping center common areas
- **Cart Rental** — Mobile retail units in mall corridors
- **Pop-up Shop** — Temporary storefronts for brand activations
- **Inline Space Rental** — Short-term traditional retail units
- **Seasonal Retail** — Holiday and seasonal retail opportunities

## Quick Links

- [Browse Spaces](/api/query) — API endpoint for programmatic access
- [For AI Assistants](/for-ai-assistants.md) — Comprehensive site overview
- [All States](/states) — Browse by state
- [Blog](/blog) — Industry insights and guides
- [Pricing](/pricing) — Pricing information
- [FAQ](/faq) — Frequently asked questions
- [News](/news) — Company and industry news
- [OpenAPI Spec](/openapi.json) — API documentation

## Coverage

Rentail.space covers specialty leasing opportunities across all 50 states, with detailed data on shopping centers, kiosks, pop-up spaces, and temporary retail locations.${blogSection}`,
    link: "https://rentail.space/",
  };
}

export function renderAbout() {
  return {
    body: `# Making retail space accessible for everyone

We're on a mission to open up retail space and help micro-merchants thrive in brick-and-mortar locations.

## Our Story

Rentail.space started with a simple observation: finding short-term retail space shouldn't be this hard. Too many talented entrepreneurs with great products never get a shot at physical retail because the traditional leasing process is complicated, expensive, and built for insiders.

In 2025, we decided to fix that. Built an AI-powered platform that connects micro-merchants with shopping centers looking to fill specialty leasing opportunities. No more cold calling property managers. No more complex negotiations. No more wondering if you're getting screwed.

We're just getting started. Our vision: make every shopping center in America accessible to entrepreneurs of all sizes.

## Our Values

- **Empowering Entrepreneurs** - Every small business deserves a shot at success. Our platform removes the barriers and makes retail space accessible to everyone.
- **Innovation First** - Use AI and modern tech to solve age-old retail leasing problems. Make it faster, easier, more transparent.
- **Community Driven** - Building a marketplace that benefits everyone—merchants, property owners, and shoppers. Not just the people at the top.

## Meet the Team

- **Assaf Arkin** - CEO & Co-founder. Repeat founder. Years working with LLMs and serving small businesses.
- **Jon Sofield** - Chief Marketplace Officer. Scaled Google My Business to 100+ million users.
- **Alex Storey** - Chief Sales Officer. Channel growth at Google. Started multiple companies in proptech.

## Our Mission

Help 1 million entrepreneurs start and grow their retail businesses. Make short-term retail space as easy to find and book as a hotel room. Physical retail should be accessible to everyone—not just people with deep pockets and industry connections.

---

**Ready to find your space?** [Start browsing](/chat) or [get in touch](mailto:hello@rentail.space).`,
    link: "https://rentail.space/about",
  };
}

export function renderBenefits() {
  return {
    body: `# Why Smart Retailers Choose Rentail.space

Short-term retail in shopping centers—without the broker fees, long leases, or runaround. Book your space today, sell tomorrow.

## Built for Merchants, Not Brokers

### No Broker Fees
Zero platform fees for merchants. You see the price, you pay the price. No hidden markups, no broker commissions, no surprises.

### AI-Powered Matching
Our AI finds spaces with the right foot traffic for your products. Tell us what you sell—we find where your customers already shop.

### Flexible Terms
Daily, weekly, or monthly. Test a new market before committing. Run your holiday pop-up without a multi-year lease hanging over you.

## Rentail vs. Traditional Leasing

| Feature | Rentail.space | Traditional Leasing |
|---|---|---|
| Speed to book | Minutes | Weeks to months |
| Commitment | Days, weeks, or months | 1–10 year leases |
| Fees | None | Broker fees + legal costs |
| Support | AI + human support | On your own |
| Availability | 24/7 self-service | Business hours only |

## More Reasons to Choose Rentail

- **24/7 Self-Service** - Browse spaces, compare options, and book at midnight if that's when inspiration strikes. No waiting for business hours.
- **Nationwide Network** - Thousands of shopping centers across the US. From major malls to neighborhood strip centers—wherever your customers are.
- **Seasonal and Pop-Up Ready** - Holiday season? Local event? Weekend market? Rent for exactly as long as you need. No year-round commitment required.
- **Direct Booking** - No middlemen taking a cut. You deal directly with property managers through our platform, keeping costs down.
- **AI Recommendations** - Tell us your product category and target customer. Our AI matches you with spaces where your specific buyers already shop.

---

**Ready to Find Your Space?** Tell our AI what you're selling and where. We'll match you with the right shopping center space in minutes. [Find My Space](/chat).`,
    link: "https://rentail.space/benefits",
  };
}

export function renderFaq() {
  return {
    body: `# Frequently Asked Questions

Everything you need to know about finding and renting short-term retail spaces.

${faq
  .map(
    (category) => `## ${category.category}

${category.questions
  .map(
    (q) => `### ${q.question}

${q.answer}
`,
  )
  .join("\n")}`,
  )
  .join("\n")}

---

**Still have questions?** Contact us at [hello@rentail.space](mailto:hello@rentail.space).`,
    link: "https://rentail.space/faq",
  };
}

export function renderGlossary() {
  return {
    body: `# Specialty Leasing Glossary

Definitions of specialty leasing and short-term retail terminology. Everything you need to understand temporary retail spaces in shopping centers across the US.

${glossary
  .map(
    (item) => `## ${item.term}

${item.alternateName.length > 0 ? `*Also known as: ${item.alternateName.join(", ")}*` : ""}

${item.definition}
`,
  )
  .join("\n")}

---

This glossary is maintained by [Rentail.space](https://rentail.space), the marketplace for specialty leasing and short-term retail spaces in shopping centers across the United States.`,
    link: "https://rentail.space/glossary",
  };
}

export function renderPricing() {
  return {
    body: `# Simple, transparent pricing

Choose the plan that works best for your business. No hidden fees, no surprises.

## For Merchants

**Free** — forever

- Browse all available retail spaces
- AI-powered space recommendations
- Direct messaging with property managers
- Book spaces instantly
- Mobile app access
- Only pay rent and utilities directly to property owner
- No platform fees, no commissions

[Get Started](/chat)

## For Shopping Centers & Malls

### Space Listing — 15% commission

- List unlimited retail spaces
- AI-powered merchant matching
- Automated lease management
- Direct merchant communication
- Payment processing included
- Lower than any agency (typically 20-30%)
- Only pay when you earn

[Contact Sales](mailto:hello@rentail.space?subject=Space%20Listing%20Inquiry)

### Specialty Leasing Booking App — $250/month per shopping center

- Everything in Space Listing
- Custom booking calendar
- Automated scheduling system
- Advanced analytics dashboard
- Multi-location management
- Priority support
- Custom integrations
- White-label options available

[Contact Sales](mailto:hello@rentail.space?subject=Specialty%20Leasing%20Booking%20App%20Inquiry)

## Frequently asked questions

### How does the 15% commission work for malls?
We only charge 15% commission on completed bookings. This is significantly lower than traditional agencies which typically charge 20-30%. You only pay when you earn revenue.

### Is the platform really free for merchants?
Yes! Merchants can browse, search, and book spaces completely free. You only pay rent and utilities directly to the property owner. No platform fees, no commissions, no hidden costs.

### What's included in the Specialty Leasing Booking App?
The $250/month per shopping center includes a complete booking management system with automated scheduling, analytics, multi-location support, and priority customer support.

### Can I cancel the booking app subscription anytime?
Yes, you can cancel your Specialty Leasing Booking App subscription at any time. There are no long-term commitments or cancellation fees.

---

**Ready to get started?** [Start finding your perfect retail space today](/chat).`,
    link: "https://rentail.space/pricing",
  };
}

export function renderPrivacy() {
  return {
    body: privacy,
    link: "https://rentail.space/privacy",
  };
}

export function renderTerms() {
  return {
    body: terms,
    link: "https://rentail.space/terms",
  };
}

export function renderForAiAssistants() {
  return {
    body: `
**For AI Assistants**

${forAIAssistants}

---

- [News Sitemap](/news/sitemap.md)
- [Blog Sitemap](/blog/sitemap.md)
    `.trim(),
    link: "https://rentail.space/for-ai-assistants",
  };
}

export async function renderStates() {
  const states = await prisma.state.findMany({
    orderBy: { name: "asc" },
  });
  const centers = await prisma.property.groupBy({
    by: ["stateAbbreviation"],
    orderBy: { stateAbbreviation: "asc" },
    _count: { _all: true },
  });

  const countCenters = (abbreviation: string) =>
    centers.find(
      (c) => c.stateAbbreviation.toLowerCase() === abbreviation.toLowerCase(),
    )?._count._all ?? 0;

  return {
    body: `# US States

Browse specialty leasing and short-term retail opportunities by state. Find kiosks, pop-up shops, carts, and temporary retail spaces in shopping centers across all 50 US states.

${states
  .filter(({ abbreviation }) => countCenters(abbreviation) > 0)
  .map(
    ({ name, abbreviation, lede }) =>
      `## [${name}](/state/${abbreviation.toLowerCase()})\n\n${lede}`,
  )
  .join("\n\n")}`,
    link: "https://rentail.space/states",
  };
}

export async function renderState(abbreviation: string) {
  const state = await prisma.state.findUnique({
    where: { abbreviation: abbreviation.toUpperCase() },
  });
  if (!state) throw new Response("Not Found", { status: 404 });

  const [centers, metroAreas, counties] = await Promise.all([
    prisma.property.findMany({
      include: { spaces: { where: { available: true } }, state: true },
      orderBy: { name: "asc" },
      where: { stateAbbreviation: state.abbreviation },
    }),
    prisma.metroArea.findMany({
      where: { stateAbbreviation: state.abbreviation },
      orderBy: { name: "asc" },
    }),
    prisma.county.findMany({
      where: { stateAbbreviation: state.abbreviation },
      orderBy: { name: "asc" },
    }),
  ]);

  const centerLines = centers.map(CENTER_CARD);

  const subAreas = [
    ...metroAreas.map((m) => ({ ...m, type: "metro" as const })),
    ...counties.map((c) => ({ ...c, type: "county" as const })),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const subAreaLines =
    subAreas.length > 0
      ? `## Browse by Area\n\n${subAreas.map((a) => `- [${a.name}](/${a.type}/${a.slug})`).join("\n")}`
      : "";

  return {
    body: `# ${state.name}

${state.lede}

${centers.length > 0 ? `## Shopping Centers (${centers.length})\n\n${centerLines.join("\n\n")}` : ""}

${subAreaLines}`,
    link: `https://rentail.space/state/${state.abbreviation.toLowerCase()}`,
  };
}

export async function renderCenter(id: string) {
  const center = await prisma.property.findUnique({
    include: { spaces: { where: { available: true } }, state: true },
    where: { id },
  });
  if (!center) throw new Response("Not Found", { status: 404 });

  const spacesMd =
    center.spaces.length > 0
      ? `\n## Available Spaces\n\n| # | Size | Floor | Type |\n|---|---|---|---|\n${center.spaces.map((s) => `| ${s.number || "—"} | ${s.size ? `${s.size} sq ft` : "—"} | ${s.floor || "—"} | ${s.type || "—"} |`).join("\n")}`
      : "";

  const imageMd =
    center.imageURLs.length > 0
      ? `\n![${center.name}](${center.imageURLs[0]})\n`
      : "";

  const demographicsMd = center.demographics
    ? `\n## Demographics\n\n${center.demographics}\n`
    : "";

  const hours =
    center.openFrom === 0 && center.openUntil === 2400
      ? "24 hours"
      : center.openFrom && center.openUntil
        ? `${Math.floor(center.openFrom / 100)}:${String(center.openFrom % 100).padStart(2, "0")}–${Math.floor(center.openUntil / 100)}:${String(center.openUntil % 100).padStart(2, "0")}`
        : "—";

  return {
    body: `# ${center.name}

${center.summary || ""}

${imageMd}

- **Address:** ${center.address}, ${center.city}, ${center.state.abbreviation}
- **Phone:** ${center.phone || "—"}
- **Website:** ${center.website || "—"}
- **Rating:** ${center.rating ? `${center.rating}/5 (${center.reviewCount || 0} reviews)` : "—"}
- **Hours:** ${hours}
- **Square Footage:** ${center.squareFootage ? `${center.squareFootage.toLocaleString()} sq ft` : "—"}
- **Number of Stores:** ${center.numberOfStores ? center.numberOfStores.toLocaleString() : "—"}

## Description

${center.description}${demographicsMd}${spacesMd}

---

[Back to ${center.state.name}](/state/${center.state.abbreviation.toLowerCase()})`,
    link: `https://rentail.space/center/${center.id}`,
  };
}

export async function renderCity(slug: string) {
  const city = await prisma.city.findUnique({
    where: { slug },
    include: { state: true },
  });
  if (!city) throw new Response("Not Found", { status: 404 });

  const centers = await prisma.property.findMany({
    include: { spaces: { where: { available: true } }, state: true },
    orderBy: { name: "asc" },
    where: { city: city.name, stateAbbreviation: city.stateAbbreviation },
  });

  const centerLines = centers.map(CENTER_CARD);

  return {
    body: `# ${city.name}, ${city.state.abbreviation}

Lease your perfect space in ${city.name}, ${city.state.abbreviation}.

${centers.length > 0 ? `## Shopping Centers (${centers.length})\n\n${centerLines.join("\n\n")}` : "No shopping centers currently available in this city."}

---

[Back to ${city.state.name}](/state/${city.stateAbbreviation.toLowerCase()})`,
    link: `https://rentail.space/city/${city.slug}`,
  };
}

export async function renderCounty(slug: string) {
  const county = await prisma.county.findUnique({
    where: { slug },
    include: { state: true, cities: { orderBy: { name: "asc" } } },
  });
  if (!county) throw new Response("Not Found", { status: 404 });

  const cityNames = county.cities.map((c) => c.name);
  const centers = await prisma.property.findMany({
    include: { spaces: { where: { available: true } }, state: true },
    orderBy: { name: "asc" },
    where: {
      city: { in: cityNames },
      stateAbbreviation: county.stateAbbreviation,
    },
  });

  const centerLines = centers.map(CENTER_CARD);
  const citiesMd =
    county.cities.length > 0
      ? `\n## Cities\n\n${county.cities.map((c) => `- [${c.name}](/city/${c.slug})`).join("\n")}`
      : "";

  return {
    body: `# ${county.name}, ${county.state.abbreviation}

Lease your perfect space in ${county.name}, ${county.state.abbreviation}.

${centers.length > 0 ? `## Shopping Centers (${centers.length})\n\n${centerLines.join("\n\n")}` : "No shopping centers currently available in this county."}${citiesMd}

---

[Back to ${county.state.name}](/state/${county.stateAbbreviation.toLowerCase()})`,
    link: `https://rentail.space/county/${county.slug}`,
  };
}

export async function renderMetro(slug: string) {
  const metro = await prisma.metroArea.findUnique({
    where: { slug },
    include: {
      state: true,
      cities: { orderBy: { name: "asc" } },
      regionalNames: { orderBy: { name: "asc" } },
    },
  });
  if (!metro) throw new Response("Not Found", { status: 404 });

  const cityNames = metro.cities.map((c) => c.name);
  const centers = await prisma.property.findMany({
    include: { spaces: { where: { available: true } }, state: true },
    orderBy: { name: "asc" },
    where: {
      city: { in: cityNames },
      stateAbbreviation: metro.stateAbbreviation,
    },
  });

  const centerLines = centers.map(CENTER_CARD);

  const subLinks = [
    ...metro.cities.map((c) => ({ name: c.name, url: `/city/${c.slug}` })),
    ...metro.regionalNames.map((r) => ({
      name: r.name,
      url: `/regional/${r.slug}`,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const subMd =
    subLinks.length > 0
      ? `\n## Browse by Area\n\n${subLinks.map((l) => `- [${l.name}](${l.url})`).join("\n")}`
      : "";

  return {
    body: `# ${metro.name} Metro Area

Lease your perfect space in the ${metro.name} metro area.

${centers.length > 0 ? `## Shopping Centers (${centers.length})\n\n${centerLines.join("\n\n")}` : "No shopping centers currently available in this metro area."}${subMd}

---

[Back to ${metro.state.name}](/state/${metro.stateAbbreviation.toLowerCase()})`,
    link: `https://rentail.space/metro/${metro.slug}`,
  };
}

export async function renderRegional(slug: string) {
  const regional = await prisma.regionalName.findUnique({
    where: { slug },
    include: { state: true, metroArea: true, relatedCities: true },
  });
  if (!regional) throw new Response("Not Found", { status: 404 });

  const cityNames = regional.relatedCities.map((c) => c.name);
  const centers = await prisma.property.findMany({
    include: { spaces: { where: { available: true } }, state: true },
    orderBy: { name: "asc" },
    where: {
      city: { in: cityNames },
      stateAbbreviation: regional.stateAbbreviation,
    },
  });

  const centerLines = centers.map(CENTER_CARD);

  const backLink = regional.metroArea
    ? `[Back to ${regional.metroArea.name}](/metro/${regional.metroArea.slug})`
    : `[Back to ${regional.state.name}](/state/${regional.stateAbbreviation.toLowerCase()})`;

  return {
    body: `# ${regional.name}

Lease your perfect space in ${regional.name}.

${centers.length > 0 ? `## Shopping Centers (${centers.length})\n\n${centerLines.join("\n\n")}` : "No shopping centers currently available in this area."}

---

${backLink}`,
    link: `https://rentail.space/regional/${regional.slug}`,
  };
}

export async function renderBlogPost(slug: string) {
  const post = await loadBlogPost(slug);
  return {
    body: `# ${post.title}

**Published:** ${formatDateHuge(post.published)}

---

![${post.alt}](/blog/${post.image})

${post.body}

---

**More blog posts:** [All blog posts](/blog/sitemap.md)`.trim(),
    link: `https://rentail.space/blog/${slug}`,
  };
}

export async function renderNewsItem(slug: string) {
  const news = await loadNewsItem(slug);
  return {
    body: `# ${news.title}

**Published:** ${formatDateHuge(news.published)}

---

${news.body}

---

**More news:** [All news](/news/sitemap.md)`.trim(),
    link: `https://rentail.space/news/${slug}`,
  };
}

export async function renderBlogSitemap() {
  const posts = await recentBlogPosts();
  return {
    body: `# Rentail Blog Sitemap

This is a sitemap of all blog posts in markdown format for AI agents.

---

${posts
  .map(
    (p) =>
      `- [${p.title}](/blog/${p.slug}) - ${p.published.toString().slice(0, 10)}`,
  )
  .join("\n")}

---

## Related Sitemaps

- [News Sitemap](/news/sitemap.md)
- [For AI Assistants](/for-ai-assistants.md)`.trim(),
    link: "https://rentail.space/blog",
  };
}

export async function renderNewsSitemap() {
  const posts = await recentNewsItems();
  return {
    body: `# Rentail News Sitemap

This is a sitemap of all news articles in markdown format for AI agents.

---

${posts
  .map(
    (p) =>
      `- [${p.title}](/news/${p.slug}) - ${p.published.toString().slice(0, 10)}`,
  )
  .join("\n")}

---

## Related Sitemaps

- [Blog Sitemap](/blog/sitemap.md)
- [For AI Assistants](/for-ai-assistants.md)`.trim(),
    link: "https://rentail.space/news",
  };
}
