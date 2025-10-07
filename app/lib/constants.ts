export const DEFAULTS = {
  LOCATION: {
    city: "Los Angeles",
    country: "United States",
    ip: "146.70.195.182",
    latitude: "37.42240",
    longitude: "-122.08421",
    state: "California",
    timeZone: "America/Los_Angeles",
  },
  AI: {
    MAX_STEPS: 3,
    TOKEN_LIMIT: 127000,
    THINKING_BUDGET: 12000,
  },
  MEMORY: {
    LAST_MESSAGES: 10,
  },
} as const;
