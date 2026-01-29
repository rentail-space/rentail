const BASE_URL = "https://rentail.space";
const DEFAULT_IMAGE = `${BASE_URL}/images/og-image.png`;

interface PageMetaProps {
  title: string;
  description: string;
  url: string;
  ogType?: string;
  image?: string;
  children?: React.ReactNode;
}

export default function PageMeta({
  title,
  description,
  url,
  ogType = "website",
  image = DEFAULT_IMAGE,
  children,
}: PageMetaProps) {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Rentail.space" />
      <meta property="og:locale" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <link rel="canonical" href={fullUrl} />
      {children}
    </>
  );
}
