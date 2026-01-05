/**
 * When sharing links to other sites (eg shopping center websites), always use
 * this function to add proper UTM parameters.
 *
 * @param url - The URL to add UTM parameters to.
 * @returns The URL with UTM parameters added.
 */
export default function externalLink(url: string): string {
  const proper = new URL(url);
  proper.searchParams.set("utm_source", "rentail.space");
  proper.searchParams.delete("utm_medium");
  proper.searchParams.delete("utm_content");
  proper.searchParams.delete("utm_campaign");
  return proper.toString();
}
