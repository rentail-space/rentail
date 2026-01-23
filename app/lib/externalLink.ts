/**
 * When sharing links to other sites (eg shopping center websites), always use
 * this function to add proper UTM parameters. UTM not added to local links.
 *
 * @param url - The URL to add UTM parameters to.
 * @returns The URL with UTM parameters added.
 */
export default function externalLink(url: string): string {
  const proper = new URL(url);
  proper.searchParams.delete("utm_source");
  proper.searchParams.delete("utm_medium");
  proper.searchParams.delete("utm_content");
  proper.searchParams.delete("utm_campaign");
  // Only absolute links to other sites need UTM parameters
  if (proper.hostname && proper.hostname !== "rentail.space")
    proper.searchParams.set("utm_source", "rentail.space");
  return proper.toString();
}
