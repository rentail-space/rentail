import type { Route } from "./+types/openapi[.]json";

export async function loader(_: Route.LoaderArgs) {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "Rentail.space API",
      description:
        "LLM-optimized API for specialty leasing and short-term retail space data in the United States",
      version: "1.0.0",
      contact: {
        email: "hello@rentail.space",
        url: "https://rentail.space/for-ai-assistants",
      },
    },
    servers: [
      {
        url: "https://rentail.space",
        description: "Production server",
      },
    ],
    paths: {
      "/api/query": {
        get: {
          summary: "Get service information and statistics",
          description:
            "Returns comprehensive information about Rentail.space services, coverage, available space types, and capabilities. Optimized for LLM consumption with structured JSON response.",
          operationId: "getServiceInfo",
          tags: ["Service Information"],
          responses: {
            "200": {
              description: "Successful response with service information",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ServiceInfo",
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ServiceInfo: {
          type: "object",
          properties: {
            services: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Available service offerings",
              example: [
                "Kiosk Rental",
                "Pop-up Shop Spaces",
                "Cart Rentals",
                "Inline Space Rental",
              ],
            },
            coverage: {
              type: "object",
              properties: {
                states: {
                  type: "integer",
                  description: "Number of US states covered",
                },
                shoppingCenters: {
                  type: "integer",
                  description: "Total number of shopping centers in database",
                },
                availableSpaces: {
                  type: "integer",
                  description: "Total number of available spaces",
                },
                topStates: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      state: {
                        type: "string",
                        description: "State code (e.g., CA, NY)",
                      },
                      centerCount: {
                        type: "integer",
                        description: "Number of centers in this state",
                      },
                    },
                  },
                },
              },
            },
            spaceTypes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    description: "Space type",
                    enum: ["Cart", "Kiosk", "Inline", "Storage", "Other"],
                  },
                  count: {
                    type: "integer",
                    description: "Number of spaces of this type",
                  },
                  description: {
                    type: "string",
                    description: "Human-readable description",
                  },
                  typicalSize: {
                    type: "string",
                    description: "Typical size range in square feet",
                  },
                },
              },
            },
            capabilities: {
              type: "object",
              properties: {
                search: {
                  type: "string",
                  description: "Search capabilities description",
                },
                chat: {
                  type: "string",
                  description: "Chat interface capabilities",
                },
                filtering: {
                  type: "string",
                  description: "Available filtering options",
                },
                details: {
                  type: "string",
                  description: "Property detail capabilities",
                },
              },
            },
            dataQuality: {
              type: "object",
              properties: {
                verifiedData: {
                  type: "string",
                  description: "Data verification methods",
                },
                structuredData: {
                  type: "string",
                  description: "Structured data formats used",
                },
                updateFrequency: {
                  type: "string",
                  description: "How often data is updated",
                },
              },
            },
            links: {
              type: "object",
              properties: {
                website: {
                  type: "string",
                  format: "uri",
                  description: "Main website URL",
                },
                chat: {
                  type: "string",
                  format: "uri",
                  description: "Chat interface URL",
                },
                glossary: {
                  type: "string",
                  format: "uri",
                  description: "Glossary of terms URL",
                },
                faq: {
                  type: "string",
                  format: "uri",
                  description: "FAQ page URL",
                },
                states: {
                  type: "string",
                  format: "uri",
                  description: "States listing URL",
                },
                forAI: {
                  type: "string",
                  format: "uri",
                  description: "AI assistants information page URL",
                },
                openapi: {
                  type: "string",
                  format: "uri",
                  description: "This OpenAPI specification URL",
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Service Information",
        description:
          "Endpoints providing information about Rentail.space services",
      },
    ],
  };

  return Response.json(spec, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
