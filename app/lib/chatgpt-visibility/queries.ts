/**
 * Test queries representing different merchant intents and search patterns
 * for finding short-term retail space in shopping malls.
 */

type TestQuery = {
  id: string;
  query: string;
  category:
    | "discovery"
    | "active_search"
    | "location_specific"
    | "cost_process";
  intent: string;
};

const queries: TestQuery[] = [
  // Discovery Phase - Learning about the market
  {
    id: "discovery_1",
    query: "How do I find short-term retail space in shopping malls?",
    category: "discovery",
    intent: "Learning about available options and platforms",
  },
  {
    id: "discovery_2",
    query:
      "What are the best platforms for finding pop-up shops in shopping centers?",
    category: "discovery",
    intent: "Platform comparison and discovery",
  },
  {
    id: "discovery_3",
    query: "How does specialty leasing in malls work?",
    category: "discovery",
    intent: "Understanding the leasing process",
  },

  // Active Search Phase - Ready to lease
  {
    id: "active_1",
    query: "Where can I lease a kiosk in a mall for 3-6 months?",
    category: "active_search",
    intent: "Immediate need with specific timeframe",
  },
  {
    id: "active_2",
    query: "Find available temporary retail space in shopping centers",
    category: "active_search",
    intent: "Browsing current inventory",
  },
  {
    id: "active_3",
    query: "Websites to browse short-term mall retail spaces",
    category: "active_search",
    intent: "Platform search for browsing",
  },

  // Location-Specific Searches
  {
    id: "location_1",
    query:
      "Short-term retail leasing opportunities in Los Angeles shopping malls",
    category: "location_specific",
    intent: "Geographic-specific search (LA market)",
  },
  {
    id: "location_2",
    query: "Pop-up shop space available in NYC shopping centers",
    category: "location_specific",
    intent: "Geographic-specific search (NYC market)",
  },

  // Cost and Process Questions
  {
    id: "cost_1",
    query:
      "How much does it cost to rent mall kiosk space for a holiday season?",
    category: "cost_process",
    intent: "Budget planning and cost research",
  },
  {
    id: "cost_2",
    query: "How to contact mall managers about temporary retail space",
    category: "cost_process",
    intent: "Process understanding and contact methods",
  },
];

export default queries;
