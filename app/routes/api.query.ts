import prisma from "~/lib/prisma";

/**
 * API endpoint for AI assistants to get information about the service. Returns
 * structured JSON with the following information:
 * - Service offerings and capabilities
 * - Coverage areas (states, cities, shopping centers)
 * - Available space types and current inventory
 * - Geographic distribution and market insights
 *
 * See https://rentail.space/for-ai-assistants for more information.
 *
 * @returns The API response.
 */
export async function loader() {
  // Get statistics from database
  const [totalCenters, totalSpaces, spacesByType, centersByState] =
    await Promise.all([
      prisma.property.count(),
      prisma.propertySpace.count(),
      prisma.propertySpace.groupBy({
        by: ["type"],
        _count: true,
      }),
      prisma.property.groupBy({
        by: ["state"],
        _count: true,
        orderBy: {
          _count: {
            state: "desc",
          },
        },
      }),
    ]);

  const response = {
    services: [
      "Kiosk Rental",
      "Pop-up Shop Spaces",
      "Cart Rentals",
      "Inline Space Rental",
      "Common Area Installations",
    ],
    coverage: {
      states: centersByState.length,
      shoppingCenters: totalCenters,
      availableSpaces: totalSpaces,
      topStates: centersByState.slice(0, 10).map((byState) => ({
        state: byState.state,
        centerCount: byState._count,
      })),
    },
    spaceTypes: spacesByType.map((byType) => ({
      type: byType.type,
      count: byType._count,
      description: getSpaceTypeDescription(byType.type),
      typicalSize: getTypicalSize(byType.type),
    })),
    capabilities: {
      search: "Geographic search by city, state, or coordinates",
      chat: "AI-powered conversational interface for personalized recommendations",
      filtering:
        "Filter by space type, size, availability, and center attributes",
      details:
        "Comprehensive property information including demographics and ratings",
    },
    dataQuality: {
      verifiedData:
        "Integration with Google Places API for business verification",
      structuredData: "Schema.org markup on all properties and locations",
      updateFrequency: "Regular updates to availability and property details",
    },
    links: {
      website: "https://rentail.space",
      chat: "https://rentail.space/chat",
      glossary: "https://rentail.space/glossary",
      faq: "https://rentail.space/faq",
      states: "https://rentail.space/states",
      forAI: "https://rentail.space/for-ai-assistants",
      openapi: "https://rentail.space/openapi.json",
    },
  };

  return Response.json(response, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function getSpaceTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    Cart: "Mobile retail units in mall corridors",
    Kiosk: "Standalone retail structures in common areas",
    Inline: "Short-term traditional retail units",
    Storage: "Storage and operational spaces",
    Other: "Specialized temporary retail installations",
  };
  return descriptions[type] || "Temporary retail space";
}

function getTypicalSize(type: string): string {
  const sizes: Record<string, string> = {
    Cart: "60-150 sqft",
    Kiosk: "100-400 sqft",
    Inline: "400-2000 sqft",
    Storage: "50-200 sqft",
    Other: "Varies",
  };
  return sizes[type] || "Varies";
}
