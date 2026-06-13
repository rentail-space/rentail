/**
 * Server-only re-export of @google-analytics/data.
 *
 * Wrapping behind a .server module prevents Vite from pre-bundling
 * @google-analytics/data for the client, where it would crash on
 * the `process` global reference.
 */
export { BetaAnalyticsDataClient } from "@google-analytics/data";
