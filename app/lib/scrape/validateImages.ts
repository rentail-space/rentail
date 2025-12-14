import imageSize from "image-size";

interface ValidatedImage {
  url: string;
  width: number;
  height: number;
  format: "png" | "jpeg";
}

function preFilterImages(imageURLs: string[]): string[] {
  const filtered = imageURLs.filter((url) => {
    const lower = url.toLowerCase();

    // Exclude small icon sizes
    if (/_(16|32|64|96|128)x\1\.|-(16|32|64|96|128)\./.test(lower))
      return false;

    // Exclude non-representative paths
    if (
      /(\/icon\/|\/logo\/|\/social\/|\/avatar\/|\/ui\/|favicon|sprite)/.test(
        lower,
      )
    )
      return false;

    // Exclude social media images
    if (/(facebook|twitter|instagram|linkedin|og-image|share)/.test(lower))
      return false;

    // Include size hints
    if (
      /(\/large\/|\/hero\/|\/banner\/|_xl\.|_xxl\.|_1200|_1920|hero|banner|main)/.test(
        lower,
      )
    )
      return true;

    // Include semantic paths
    if (
      /(\/gallery\/|\/images\/property\/|\/center\/|\/mall\/|\/shopping)/.test(
        lower,
      )
    )
      return true;

    return true; // Default: include
  });

  // Fallback if too few results
  return filtered.length >= 3 ? filtered : imageURLs.slice(0, 10);
}

async function validateImageSet(
  imageURLs: string[],
): Promise<ValidatedImage[]> {
  const results: ValidatedImage[] = [];

  for (const url of imageURLs) {
    try {
      // Download with 10s timeout
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) continue;

      // Check Content-Type
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.match(/image\/(png|jpeg|jpg)/i)) continue;

      // Get image buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Get dimensions using image-size
      const dimensions = imageSize(buffer);

      // Validate dimensions exist and meet minimums
      if (
        dimensions.width &&
        dimensions.height &&
        dimensions.width >= 500 &&
        dimensions.height >= 400
      ) {
        results.push({
          url,
          width: dimensions.width,
          height: dimensions.height,
          format: dimensions.type === "png" ? "png" : "jpeg",
        });

        // Early exit after finding 5 valid images
        if (results.length >= 5) break;
      }
    } catch (_error) {}
  }

  return results;
}

export default async function validateImages(
  imageURLs: string[],
): Promise<string[]> {
  // 1. Pre-filter URLs using heuristics
  const filtered = preFilterImages(imageURLs);

  // 2. Validate filtered images (download + check)
  const validated = await validateImageSet(filtered);

  // 3. Return valid URLs (or empty array)
  return validated.map((img) => img.url);
}
