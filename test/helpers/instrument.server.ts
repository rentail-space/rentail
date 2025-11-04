/**
 * Instrumentation for the test server.
 * This file is imported when starting the production server in test mode.
 */

// Import the main instrumentation file but don't initialize Sentry
// since we don't want to send test data to Sentry
