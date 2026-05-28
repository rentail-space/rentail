import { useEffect } from "react";
import GA4 from "react-ga4";

/**
 * Call this once in the root component to initialize Google Analytics.
 */
export function useGoogleAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;

    try {
      GA4.initialize("G-HLE5G8GC5Y");
    } catch (error) {
      // Silently fail if blocked by content blocker or ad blocker
      if (
        error instanceof Error &&
        !error.message.includes("Content blocker")
      ) {
        console.error("Google Analytics initialization error: %s", error);
      }
    }
  }, []);
}

/**
 * Track an event in Google Analytics.
 *
 * @param action - The action of the event.
 * @param params - The parameters for the event.
 * @param params.category - The category of the event.
 * @param params.label - The label of the event.
 * @param params.value - The value of the event.
 * @see https://developers.google.com/tag-platform/gtagjs/reference/events
 */
export function trackEvent(
  action: string,
  params: {
    category: string;
    label?: string;
    value?: number;
  },
) {
  if (!import.meta.env.PROD) return;

  try {
    GA4.event({
      action,
      category: params.category,
      label: params.label,
      value: params.value,
      transport: "beacon",
    });
  } catch (error) {
    // Silently fail if blocked by content blocker
    console.error("GA4 event error: %s", error);
  }
}
