/**
 * Parse citations from ChatGPT responses and extract rentail.space mentions.
 */

type Citation = {
  url: string;
  position: number; // 1-indexed position in citation list
  context: string; // Surrounding text where citation appears
  isRentailSpace: boolean;
};

export type ParsedResponse = {
  citations: Citation[];
  rentailSpaceCitations: Citation[];
  totalCitations: number;
  rentailSpaceCount: number;
  hasRentailSpaceInFirstPlace: boolean;
  rawResponse: string;
};

/**
 * Check if a URL is from rentail.space
 */
function isRentailSpaceUrl(url: string): boolean {
  const normalizedUrl = url.toLowerCase();
  return (
    normalizedUrl.includes("rentail.space") ||
    normalizedUrl.includes("rentail-space") ||
    normalizedUrl.includes("www.rentail.space")
  );
}

/**
 * Extract URLs from various citation formats:
 * - Inline citations: 【1】, [1], (1)
 * - Reference lists: "1. https://..." or "[1] https://..."
 * - Markdown links: [text](url)
 */
function extractCitationsFromText(text: string): Citation[] {
  const citations: Citation[] = [];
  const seenUrls = new Set<string>();

  // Pattern 1: Sources section with numbered list
  // Example: "1. https://rentail.space - Description"
  const sourcesSection = text.match(/Sources?:?\s*\n([\s\S]*?)($|\n\n)/i);
  if (sourcesSection) {
    const sourcesText = sourcesSection[1];
    const sourceLines = sourcesText.split("\n");

    for (const line of sourceLines) {
      // Match patterns like:
      // "1. https://example.com"
      // "[1] https://example.com"
      // "1) https://example.com"
      const match = line.match(
        /^\s*[[(]?(\d+)[)\]]?\.?\s+(https?:\/\/[^\s]+)/i,
      );
      if (match) {
        const position = Number.parseInt(match[1], 10);
        const url = match[2].replace(/[,;.]$/, ""); // Remove trailing punctuation

        if (!seenUrls.has(url)) {
          citations.push({
            context: line.trim(),
            isRentailSpace: isRentailSpaceUrl(url),
            position,
            url,
          });
          seenUrls.add(url);
        }
      }
    }
  }

  // Pattern 2: Markdown links [text](url)
  const markdownLinks = text.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g);
  for (const match of markdownLinks) {
    const url = match[2];
    if (!seenUrls.has(url)) {
      // Assign position based on order of appearance if not in sources list
      const position = citations.length + 1;
      citations.push({
        context: match[0],
        isRentailSpace: isRentailSpaceUrl(url),
        position,
        url,
      });
      seenUrls.add(url);
    }
  }

  // Pattern 3: Plain URLs in text (fallback)
  const plainUrls = text.matchAll(/https?:\/\/[^\s<>[\]()]+/g);
  for (const match of plainUrls) {
    const url = match[0].replace(/[,;.]$/, "");
    if (!seenUrls.has(url)) {
      const position = citations.length + 1;
      citations.push({
        context: match[0],
        isRentailSpace: isRentailSpaceUrl(url),
        position,
        url,
      });
      seenUrls.add(url);
    }
  }

  // Sort by position to ensure correct ordering
  return citations.sort((a, b) => a.position - b.position);
}

/**
 * Check if rentail.space is mentioned in the text (not just as a citation)
 */
function extractTextMentions(text: string): number {
  const lowerText = text.toLowerCase();
  const mentions = lowerText.match(/rentail\.space/g) || [];
  return mentions.length;
}

/**
 * Parse a ChatGPT response and extract all citation data
 */
export default function parseCitations(response: string): ParsedResponse {
  const citations = extractCitationsFromText(response);
  const rentailSpaceCitations = citations.filter((c) => c.isRentailSpace);

  // Also count text mentions (non-citation references)
  const textMentionCount = extractTextMentions(response);

  // Total unique mentions (citations + text mentions - duplicates)
  const rentailSpaceCount =
    rentailSpaceCitations.length > 0
      ? rentailSpaceCitations.length + Math.max(0, textMentionCount - 1)
      : textMentionCount;

  return {
    citations,
    rentailSpaceCitations,
    totalCitations: citations.length,
    rentailSpaceCount,
    hasRentailSpaceInFirstPlace:
      citations.length > 0 && citations[0].isRentailSpace,
    rawResponse: response,
  };
}
