import type { MetaDescriptor } from "react-router";

const BASE_URL = "https://rentail.space";
const DEFAULT_IMAGE = `${BASE_URL}/images/og-image.png`;

interface PageMetaArgs {
  title: string;
  description: string;
  url: string;
  keywords: string;
  ogType?: string;
  image?: string;
  author?: string;
}

export default function pageMeta({
  title,
  description,
  url,
  keywords,
  ogType = "website",
  image = DEFAULT_IMAGE,
  author = "rentail.space",
}: PageMetaArgs): MetaDescriptor[] {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  const fullTitle = title.includes("Rentail.space")
    ? title
    : `${title} | Rentail.space`;

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    { name: "author", content: author },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:url", content: fullUrl },
    { property: "og:type", content: ogType },
    { property: "og:site_name", content: "Rentail.space" },
    { property: "og:locale", content: "en_US" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { tagName: "link", rel: "canonical", href: fullUrl },
  ];
}
