/**
 * Metro area mappings: city aliases to counties
 *
 * Used by grid-based collection to expand city searches to full metro areas
 */

export const METRO_AREAS: Record<string, string[]> = {
  LA: [
    "Los Angeles County, CA",
    "Orange County, CA",
    "Riverside County, CA",
    "San Bernardino County, CA",
  ],
  "Los Angeles": [
    "Los Angeles County, CA",
    "Orange County, CA",
    "Riverside County, CA",
    "San Bernardino County, CA",
  ],
  NYC: [
    "New York County, NY",
    "Kings County, NY",
    "Queens County, NY",
    "Bronx County, NY",
    "Nassau County, NY",
    "Westchester County, NY",
  ],
  "New York": [
    "New York County, NY",
    "Kings County, NY",
    "Queens County, NY",
    "Bronx County, NY",
    "Nassau County, NY",
    "Westchester County, NY",
  ],
  SF: [
    "San Francisco County, CA",
    "San Mateo County, CA",
    "Santa Clara County, CA",
    "Alameda County, CA",
    "Contra Costa County, CA",
  ],
  "San Francisco": [
    "San Francisco County, CA",
    "San Mateo County, CA",
    "Santa Clara County, CA",
    "Alameda County, CA",
    "Contra Costa County, CA",
  ],
  Chicago: ["Cook County, IL", "DuPage County, IL", "Lake County, IL"],
  Dallas: [
    "Dallas County, TX",
    "Tarrant County, TX",
    "Collin County, TX",
    "Denton County, TX",
  ],
  Houston: [
    "Harris County, TX",
    "Fort Bend County, TX",
    "Montgomery County, TX",
  ],
  Phoenix: ["Maricopa County, AZ", "Pinal County, AZ"],
  Philadelphia: [
    "Philadelphia County, PA",
    "Delaware County, PA",
    "Montgomery County, PA",
    "Bucks County, PA",
  ],
  Atlanta: [
    "Fulton County, GA",
    "DeKalb County, GA",
    "Cobb County, GA",
    "Gwinnett County, GA",
  ],
  Miami: ["Miami-Dade County, FL", "Broward County, FL"],
  Seattle: ["King County, WA", "Snohomish County, WA", "Pierce County, WA"],
  Boston: [
    "Suffolk County, MA",
    "Middlesex County, MA",
    "Norfolk County, MA",
    "Essex County, MA",
  ],
  "Las Vegas": ["Clark County, NV"],
};

/**
 * Resolve city input to list of counties
 *
 * @param input City name or alias (e.g., "LA", "Los Angeles")
 * @returns Array of county names, or single-item array with input if no mapping found
 */
export function resolveMetroArea(input: string): string[] {
  const normalized = input.trim();

  // Check direct match (case-insensitive)
  for (const [key, counties] of Object.entries(METRO_AREAS))
    if (key.toLowerCase() === normalized.toLowerCase()) return counties;

  // No mapping found - return input as-is (assume it's a county or city name)
  return [normalized];
}
