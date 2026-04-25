/**
 * Server-side device and viewport detection utilities.
 *
 * Uses Client Hints (modern browsers) with User-Agent fallback for mobile detection.
 * Viewport size can be detected via Client Hints or cookies set by client-side code.
 */

interface DeviceInfo {
  /** Whether the device is mobile (from Client Hints or User-Agent) */
  isMobile: boolean;
  /** Viewport width in pixels, if available */
  viewportWidth?: number;
  /** Viewport height in pixels, if available */
  viewportHeight?: number;
  /** User-Agent string, if available */
  userAgent?: string;
}

/**
 * Detects if a device is mobile based on User-Agent string.
 * This is a fallback when Client Hints are not available.
 */
function isMobileFromUserAgent(userAgent?: string | null): boolean {
  if (!userAgent) return false;

  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
  return mobileRegex.test(userAgent);
}

/**
 * Extracts device information from request headers.
 *
 * Detection methods (in order of preference):
 * 1. Client Hints (Sec-CH-UA-Mobile, Sec-CH-Viewport-Width, Sec-CH-Viewport-Height)
 * 2. User-Agent parsing (for mobile detection)
 * 3. Cookie-based viewport (if client sends viewport info)
 *
 * @param headers - Request headers object
 * @returns Device information including mobile status and viewport dimensions
 *
 * @example
 * ```ts
 * export async function loader({ request }: Route.LoaderArgs) {
 *   const deviceInfo = getDeviceInfo(request.headers);
 *   if (deviceInfo.isMobile) {
 *     // Serve mobile-optimized content
 *   }
 *   return data({ deviceInfo });
 * }
 * ```
 */
export function getDeviceInfo(headers: Headers): DeviceInfo {
  // 1. Try Client Hints first (most accurate, modern browsers)
  const chMobile = headers.get("sec-ch-ua-mobile");
  const chViewportWidth = headers.get("sec-ch-viewport-width");
  const chViewportHeight = headers.get("sec-ch-viewport-height");

  let isMobile = false;
  if (chMobile !== null) {
    // Client Hints returns "?1" for mobile, "?0" for desktop
    isMobile = chMobile === "?1";
  } else {
    // 2. Fallback to User-Agent parsing
    const userAgent = headers.get("user-agent");
    isMobile = isMobileFromUserAgent(userAgent);
  }

  // Parse viewport dimensions
  let viewportWidth: number | undefined;
  let viewportHeight: number | undefined;

  if (chViewportWidth && chViewportHeight) {
    // Client Hints viewport (most accurate)
    const width = Number.parseInt(chViewportWidth, 10);
    const height = Number.parseInt(chViewportHeight, 10);
    if (!Number.isNaN(width) && !Number.isNaN(height)) {
      viewportWidth = width;
      viewportHeight = height;
    }
  }

  return {
    isMobile,
    viewportWidth,
    viewportHeight,
    userAgent: headers.get("user-agent") || undefined,
  };
}
