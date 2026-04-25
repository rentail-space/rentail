/**
 * Grid search utilities for comprehensive geographic coverage
 * Generates hexagonal grids for systematic area searching
 */

import type { BoundingBox, LatLng } from "./geocodeCounty.server";

/**
 * Generate hexagonal grid of search points for comprehensive coverage
 *
 * Uses hexagonal packing for optimal coverage with minimal overlap (~15%)
 * Vertical spacing: radiusKm × √3 ≈ 1.732 × radiusKm
 * Horizontal spacing: radiusKm × 1.5
 *
 * @param bounds Bounding box to cover
 * @param radiusKm Search radius in kilometers
 * @param bufferKm Extra buffer around bounds in km to catch edge cases
 * @returns Array of center points for searches
 */
export default function generateHexGrid(
  bounds: BoundingBox,
  radiusKm: number,
  bufferKm: number,
): LatLng[] {
  // Hexagonal spacing calculations
  const verticalSpacingKm = radiusKm * Math.sqrt(3); // ≈ 86.6km for 50km radius
  const horizontalSpacingKm = radiusKm * 1.5; // 75km for 50km radius

  // Convert km to degrees (approximate, varies by latitude)
  // At equator: 1° lat ≈ 111km, 1° lng ≈ 111km
  // At 40°N: 1° lat ≈ 111km, 1° lng ≈ 85km
  const avgLat = (bounds.north + bounds.south) / 2;
  const latDegreesPerKm = 1 / 111.32; // Constant for latitude
  const lngDegreesPerKm = 1 / (111.32 * Math.cos((avgLat * Math.PI) / 180)); // Varies by latitude

  const verticalSpacingDeg = verticalSpacingKm * latDegreesPerKm;
  const horizontalSpacingDeg = horizontalSpacingKm * lngDegreesPerKm;

  // Add buffer to bounds
  const bufferLat = bufferKm * latDegreesPerKm;
  const bufferLng = bufferKm * lngDegreesPerKm;

  const expandedBounds = {
    north: bounds.north + bufferLat,
    south: bounds.south - bufferLat,
    east: bounds.east + bufferLng,
    west: bounds.west - bufferLng,
  };

  // Generate grid points
  const points: LatLng[] = [];
  let rowIndex = 0;

  // Iterate from south to north
  for (
    let lat = expandedBounds.south;
    lat <= expandedBounds.north;
    lat += verticalSpacingDeg
  ) {
    // Offset even/odd rows for hexagonal pattern
    const lngOffset = rowIndex % 2 === 0 ? 0 : horizontalSpacingDeg / 2;

    // Iterate from west to east
    for (
      let lng = expandedBounds.west + lngOffset;
      lng <= expandedBounds.east;
      lng += horizontalSpacingDeg
    ) {
      // Only include points within original bounds (with buffer)
      if (
        lat >= expandedBounds.south &&
        lat <= expandedBounds.north &&
        lng >= expandedBounds.west &&
        lng <= expandedBounds.east
      )
        points.push({ lat, lng });
    }

    rowIndex++;
  }

  return points;
}
