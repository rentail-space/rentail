import { parse } from "csv-parse/sync";
import debug from "debug";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  City,
  County,
  MetroArea,
  RegionalName,
  State,
} from "prisma/generated";
import z from "zod";
import prisma from "~/lib/prisma.server";
import { slugify } from "~/lib/utils";

const logger = debug("seed");

/**
 * Seeds list of all states, cities, counties, and metro areas. Also seeds
 * regional names for each city:
 * - California (state)
 * - Los Angeles (city)
 * - Bay Area (metro area)
 * - Santa Clara County (county)
 * - San Fernando Valley (regional name)
 */
export default async function seedStatesAndRelatedData() {
  const states = await seedStates();
  const hasState = (state: string) =>
    !!states.find(({ abbreviation }) => abbreviation === state);

  const metroAreas = await seedMetroAreas({ hasState });
  const hasMetroArea = (metroArea: string) =>
    !!metroAreas.find(({ id }) => id === metroArea);

  const counties = await seedCounties({ hasState });
  const hasCounty = (county: string) =>
    !!counties.find(({ id }) => id === county);

  const cities = await seedCities({ hasState, hasMetroArea, hasCounty });
  const hasCity = (city: string) => !!cities.find(({ id }) => id === city);

  await seedRegionalNames({ hasState, hasMetroArea, hasCounty, hasCity });
}

async function seedStates(): Promise<State[]> {
  // PROMPT:
  //
  // write a short blurb about New Jersey state. what's special about it, why
  // would I want to open a retail space in a shopping center in new your state.
  // Make it two paragraphs, with 2~3 sentences in each paragraph. capture the
  // reader's imagination and entice them to click the link. Use numbers if you
  // have them.

  const stateSchema = z.array(
    z.object({
      name: z.string(),
      abbreviation: z.string(),
      lede: z.string(),
    }),
  );
  const states = await readFile(resolve("prisma/seed/states.json"), "utf-8");
  const statesData = stateSchema.parse(JSON.parse(states));
  logger("🔄 Seeding %d states", statesData.length);
  for (const state of statesData) {
    await prisma.state.upsert({
      where: { abbreviation: state.abbreviation },
      update: { ...state, country: "US" },
      create: { ...state, country: "US" },
    });
  }
  return await prisma.state.findMany();
}

async function seedMetroAreas({
  hasState,
}: {
  hasState: (state: string) => boolean;
}): Promise<MetroArea[]> {
  const metroAreas = await loadCSV<{
    metro_id: string;
    metro_name: string;
    state: string;
  }>("prisma/seed/metro_areas.csv");
  const seedable = metroAreas.filter((metroArea) => hasState(metroArea.state));
  logger("🔄 Seeding %d/%d metro areas", seedable.length, metroAreas.length);

  for (const metroArea of seedable) {
    const slug = slugify(metroArea.state, metroArea.metro_name);
    await prisma.metroArea.upsert({
      where: { id: metroArea.metro_id },
      update: {
        name: metroArea.metro_name,
        slug,
        state: { connect: { abbreviation: metroArea.state } },
      },
      create: {
        id: metroArea.metro_id,
        name: metroArea.metro_name,
        slug,
        state: { connect: { abbreviation: metroArea.state } },
      },
    });
  }
  return await prisma.metroArea.findMany();
}

async function seedCounties({
  hasState,
}: {
  hasState: (state: string) => boolean;
}): Promise<County[]> {
  const counties = await loadCSV<{
    county_id: string;
    county_name: string;
    state: string;
  }>("prisma/seed/counties.csv");
  const seedable = counties.filter((county) => hasState(county.state));
  logger("🔄 Seeding %d/%d counties", seedable.length, counties.length);

  for (const county of seedable) {
    const slug = slugify(county.state, county.county_name);
    await prisma.county.upsert({
      where: { id: county.county_id },
      create: {
        id: county.county_id,
        name: county.county_name,
        slug,
        state: { connect: { abbreviation: county.state } },
      },
      update: {
        name: county.county_name,
        slug,
        state: { connect: { abbreviation: county.state } },
      },
    });
  }
  return await prisma.county.findMany();
}

async function seedCities({
  hasState,
  hasMetroArea,
  hasCounty,
}: {
  hasMetroArea: (metroArea: string) => boolean;
  hasCounty: (county: string) => boolean;
  hasState: (state: string) => boolean;
}): Promise<City[]> {
  const cities = await loadCSV<{
    city_id: string;
    city_name: string;
    metro_id: string;
    county_id: string;
    state: string;
  }>("prisma/seed/cities.csv");
  const seedable = cities.filter(
    (city) =>
      hasState(city.state) &&
      hasMetroArea(city.metro_id) &&
      hasCounty(city.county_id),
  );
  logger("🔄 Seeding %d/%d cities", seedable.length, cities.length);

  for (const city of seedable) {
    const slug = slugify(city.state, city.city_name);
    await prisma.city.upsert({
      where: { id: city.city_id },
      create: {
        id: city.city_id,
        name: city.city_name,
        slug,
        metroArea: { connect: { id: city.metro_id } },
        county: { connect: { id: city.county_id } },
        state: { connect: { abbreviation: city.state } },
      },
      update: {
        name: city.city_name,
        slug,
        metroArea: { connect: { id: city.metro_id } },
        county: { connect: { id: city.county_id } },
        state: { connect: { abbreviation: city.state } },
      },
    });
  }
  return await prisma.city.findMany();
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
}): Promise<RegionalName[]> {
  const regionalNames = await loadCSV<{
    region_id: string;
    region_name: string;
    metro_id: string;
    related_cities: string;
    related_counties: string;
    state: string;
  }>("prisma/seed/regional_names.csv");
  const seedable = regionalNames.filter(
    (regionalName) =>
      hasState(regionalName.state) &&
      hasMetroArea(regionalName.metro_id) &&
      regionalName.related_counties.split("|").every(hasCounty) &&
      regionalName.related_cities.split("|").every(hasCity),
  );
  logger(
    "🔄 Seeding %d/%d regional names",
    seedable.length,
    regionalNames.length,
  );

  for (const regionalName of seedable) {
    const relatedCities = regionalName.related_cities.split("|");
    const relatedCounties = regionalName.related_counties.split("|");
    const slug = slugify(regionalName.state, regionalName.region_name);
    await prisma.regionalName.upsert({
      where: { id: regionalName.region_id },
      create: {
        id: regionalName.region_id,
        name: regionalName.region_name,
        slug,
        metroArea: { connect: { id: regionalName.metro_id } },
        relatedCounties: {
          connect: relatedCounties.map((county) => ({ id: county })),
        },
        relatedCities: { connect: relatedCities.map((city) => ({ id: city })) },
        state: { connect: { abbreviation: regionalName.state } },
      },
      update: {
        name: regionalName.region_name,
        slug,
        metroArea: { connect: { id: regionalName.metro_id } },
        relatedCounties: {
          connect: relatedCounties.map((county) => ({ id: county })),
        },
        relatedCities: { connect: relatedCities.map((city) => ({ id: city })) },
        state: { connect: { abbreviation: regionalName.state } },
      },
    });
  }
  return await prisma.regionalName.findMany();
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
