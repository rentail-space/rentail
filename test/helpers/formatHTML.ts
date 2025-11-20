/**
 * Formats an HTML string into a nicely indented tree.
 * Works in Node.js without JSDOM or external HTML parsers.
 * Assumes clean HTML (e.g., from browser innerHTML).
 */
export function formatHTMLTree(html: string): string {
  const INDENT = "  ";
  let result = "";
  let level = 0;

  // Simple regex-based HTML tokenizer
  // Matches: opening tags, closing tags, text nodes, and self-closing tags
  const tokenRegex = /<\/?[\w-]+(?:\s+[\w-]+=(?:"[^"]*"|'[^']*'))*\s*\/?>/g;

  // Strip all <script ...>...</script> elements from html to create noScript variable
  // and all <!-- ... --> comments
  const withoutScript = html
    .replaceAll(/<script\b[^>]*>[\s\S]*?<\/script>/gim, "")
    .replaceAll(/<!--[\s\S]*?-->/g, "");

  // Split HTML into tokens and text content
  let lastIndex = 0;
  let match = tokenRegex.exec(withoutScript);

  while (match !== null) {
    // Get text content before this tag
    const textBefore = withoutScript.slice(lastIndex, match.index).trim();
    if (textBefore) result += `${INDENT.repeat(level)}${textBefore}\n`;

    const tag = match[0];
    lastIndex = match.index + tag.length;

    // Check if it's a closing tag
    if (tag.startsWith("</")) {
      level = Math.max(0, level - 1);
      result += `${INDENT.repeat(level)}${sortTagAttributes(tag)}\n`;
    }
    // Check if it's a self-closing tag
    else if (tag.endsWith("/>") || isSelfClosingTag(tag))
      result += `${INDENT.repeat(level)}${sortTagAttributes(tag)}\n`;
    // It's an opening tag
    else {
      result += `${INDENT.repeat(level)}${tag}\n`;
      level++;
    }
    match = tokenRegex.exec(withoutScript);
  }

  // Get any remaining text after the last tag
  const textAfter = withoutScript.slice(lastIndex).trim();
  if (textAfter) result += `${INDENT.repeat(level)}${textAfter}\n`;

  return `${result.trim()}\n`;
}

/**
 * Sorts all attributes of an opening or self-closing tag and returns the result.
 * Handles both self-closing ("<input ... />") and normal opening ("<div ...>") tags.
 *
 * @param tag - The HTML tag as a string.
 * @returns The tag with sorted attributes.
 */
function sortTagAttributes(tag: string): string {
  // Match the opening or self-closing tag, capturing tag name and attributes
  // e.g. <div id="b" class="a"> or <img src="b" alt="a"/>
  const tagRegex =
    /^<([\w-]+)((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\s*(\/?)>$/;
  const match = tag.match(tagRegex);
  if (!match) return tag;

  const tagName = match[1];
  const attributesStr = match[2];
  const isSelfClosing = !!match[3];

  // Regex to match attributes: name[=value]
  // Handles quoted and unquoted values; only supporting quoted values here for safety
  const attrRegex = /([\w-]+)(=(?:"[^"]*"|'[^']*'))?/g;
  const attributes: string[] = [];
  let attrMatch = attrRegex.exec(attributesStr);
  while (attrMatch) {
    attributes.push(attrMatch[0].trim());
    attrMatch = attrRegex.exec(attributesStr);
  }

  attributes.sort((a, b) => {
    // Sort by attribute name (case-insensitive)
    const nameA = a.split("=")[0].toLowerCase();
    const nameB = b.split("=")[0].toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const sortedAttrs = attributes.length ? ` ${attributes.join(" ")}` : "";

  return `<${tagName}${sortedAttrs}${isSelfClosing ? " /" : ""}>`;
}

/**
 * Check if a tag is self-closing (void elements in HTML).
 */
function isSelfClosingTag(tag: string): boolean {
  const selfClosingTags = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
  ];

  const tagMatch = /<([\w-]+)/.exec(tag);
  return (
    tagMatch !== null && selfClosingTags.includes(tagMatch[1].toLowerCase())
  );
}
