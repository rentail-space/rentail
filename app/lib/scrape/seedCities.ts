import { parse } from "csv-parse/sync";
import debug from "debug";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import prisma from "~/lib/prisma";

const logger = debug("seed");

/**
 * Seeds list of all cities, counties, and metro areas. Also seeds regional
 * names for each city. For example:
 * - Los Angeles (city)
 * - Bay Area (metro area)
 * - Santa Clara County (county)
 * - San Fernando Valley (regional name)
 */
export default async function seedCityInfo() {
  const states = await prisma.state.findMany();
  const hasState = (state: string) =>
    !!states.find(({ abbreviation }) => abbreviation === state);

  const metroAreas = await prisma.metroArea.findMany();
  const hasMetroArea = (metroArea: string) =>
    !!metroAreas.find(({ id }) => id === metroArea);

  const counties = await prisma.county.findMany();
  const hasCounty = (county: string) =>
    !!counties.find(({ id }) => id === county);

  await seedMetroAreas({ hasState });
  await seedCounties({ hasState });
  await seedCities({ hasState, hasMetroArea, hasCounty });

  const cities = await prisma.city.findMany();
  const hasCity = (city: string) => !!cities.find(({ id }) => id === city);

  await seedRegionalNames({ hasState, hasMetroArea, hasCounty, hasCity });
}

async function seedMetroAreas({
  hasState,
}: {
  hasState: (state: string) => boolean;
}) {
  const metroAreas = await loadCSV<{
    metro_id: string;
    metro_name: string;
    state: string;
  }>("prisma/seed/metro_areas.csv");
  logger("🔄 Seeding %s metro areas", metroAreas.length);

  for (const metroArea of metroAreas) {
    if (!hasState(metroArea.state)) continue;
    await prisma.metroArea.upsert({
      where: { id: metroArea.metro_id },
      update: {
        name: metroArea.metro_name,
        state: { connect: { abbreviation: metroArea.state } },
      },
      create: {
        id: metroArea.metro_id,
        name: metroArea.metro_name,
        state: { connect: { abbreviation: metroArea.state } },
      },
    });
  }
}

async function seedCounties({
  hasState,
}: {
  hasState: (state: string) => boolean;
}) {
  const counties = await loadCSV<{
    county_id: string;
    county_name: string;
    state: string;
  }>("prisma/seed/counties.csv");
  logger("🔄 Seeding %s counties", counties.length);

  for (const county of counties) {
    if (!hasState(county.state)) continue;
    await prisma.county.upsert({
      where: { id: county.county_id },
      create: {
        id: county.county_id,
        name: county.county_name,
        state: { connect: { abbreviation: county.state } },
      },
      update: {
        name: county.county_name,
        state: { connect: { abbreviation: county.state } },
      },
    });
  }
}

async function seedCities({
  hasState,
  hasMetroArea,
  hasCounty,
}: {
  hasMetroArea: (metroArea: string) => boolean;
  hasCounty: (county: string) => boolean;
  hasState: (state: string) => boolean;
}) {
  const cities = await loadCSV<{
    city_id: string;
    city_name: string;
    metro_id: string;
    county_id: string;
    state: string;
  }>("prisma/seed/cities.csv");
  logger("🔄 Seeding %s cities", cities.length);

  for (const city of cities) {
    if (
      !hasState(city.state) ||
      !hasMetroArea(city.metro_id) ||
      !hasCounty(city.county_id)
    )
      continue;
    await prisma.city.upsert({
      where: { id: city.city_id },
      create: {
        id: city.city_id,
        name: city.city_name,
        metroArea: { connect: { id: city.metro_id } },
        county: { connect: { id: city.county_id } },
        state: { connect: { abbreviation: city.state } },
      },
      update: {
        name: city.city_name,
        metroArea: { connect: { id: city.metro_id } },
        county: { connect: { id: city.county_id } },
        state: { connect: { abbreviation: city.state } },
      },
    });
  }
}

async function seedRegionalNames({
  hasState,
  hasMetroArea,
  hasCounty,
  hasCity,
}: {
  hasState: (state: string) => boolean;
  hasMetroArea: (metroArea: string) => boolean;
  hasCounty: (county: string) => boolean;
  hasCity: (city: string) => boolean;
}) {
  const regionalNames = await loadCSV<{
    region_id: string;
    region_name: string;
    metro_id: string;
    related_cities: string;
    related_counties: string;
    state: string;
  }>("prisma/seed/regional_names.csv");
  logger("🔄 Seeding %s regional names", regionalNames.length);

  for (const regionalName of regionalNames) {
    const relatedCities = regionalName.related_cities.split("|");
    const relatedCounties = regionalName.related_counties.split("|");
    if (
      !hasState(regionalName.state) ||
      !hasMetroArea(regionalName.metro_id) ||
      !relatedCounties.every(hasCounty) ||
      !relatedCities.every(hasCity)
    )
      continue;
    await prisma.regionalName.upsert({
      where: { id: regionalName.region_id },
      create: {
        id: regionalName.region_id,
        name: regionalName.region_name,
        metroArea: { connect: { id: regionalName.metro_id } },
        relatedCounties: {
          connect: relatedCounties.map((county) => ({ id: county })),
        },
        relatedCities: { connect: relatedCities.map((city) => ({ id: city })) },
        state: { connect: { abbreviation: regionalName.state } },
      },
      update: {
        name: regionalName.region_name,
        metroArea: { connect: { id: regionalName.metro_id } },
        relatedCounties: {
          connect: relatedCounties.map((county) => ({ id: county })),
        },
        relatedCities: { connect: relatedCities.map((city) => ({ id: city })) },
        state: { connect: { abbreviation: regionalName.state } },
      },
    });
  }
}

// Example usage: load a CSV at "prisma/seed/myfile.csv"
async function loadCSV<T>(csvPath: string): Promise<T[]> {
  const csvData = await readFile(resolve(csvPath), {
    encoding: "utf-8",
  });
  return parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}
