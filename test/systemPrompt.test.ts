import { invariant } from "node_modules/es-toolkit/dist/util/invariant.mjs";
import { beforeAll, describe, expect, it } from "vitest";
import systemPrompt from "~/lib/systemPrompt";
import { userProfile } from "~/lib/userProfile";

describe("prompt()", () => {
  let prompt: string;

  beforeAll(() => {
    prompt = systemPrompt({ userProfile, properties: sampleProperties });
  });

  it("includes clear instructions", () => {
    expect(prompt).toContain(
      "You are a virtual assistant for a specialty leasing retail space service",
    );
    expect(prompt).toContain(
      "You help merchants find the retail space that's best for their needs",
    );
  });

  it("includes current date and time", () => {
    // Extract date from prompt (format: YYYY-MM-DD)
    const dateMatch = /date is (\d{4}-\d{2}-\d{2})/.exec(prompt);
    expect(dateMatch).toBeTruthy();
    if (!dateMatch) throw new Error("Date match not found");

    // Verify date format is valid and is today's date (UTC)
    const [year, month, day] = dateMatch[1].split("-").map(Number);

    const today = new Date();
    expect(year).toBe(today.getFullYear());
    expect(month).toEqual(expect.closeTo(today.getUTCMonth() + 1));
    expect(day).toEqual(expect.closeTo(today.getUTCDate()));
  });

  it("includes current time", () => {
    // Extract time from prompt (format: HH:MM:SS)
    const timeMatch = /time is (\d{2}:\d{2}:\d{2})/.exec(prompt);
    expect(timeMatch).toBeTruthy();
    if (!timeMatch) throw new Error("Time match not found");

    // Verify time format is valid
    const [hours, minutes, seconds] = timeMatch[1].split(":").map(Number);
    const now = new Date();
    expect(hours).toEqual(expect.closeTo(now.getUTCHours()));
    expect(minutes).toEqual(expect.closeTo(now.getUTCMinutes()));
    expect(seconds).toEqual(expect.closeTo(now.getUTCSeconds()));
  });

  it("includes user profile schema", () => {
    const json = prompt.match(/```json\n(.*?)\n```/ms)?.[1];
    invariant(json, "JSON match not found");
    const parsed = JSON.parse(json);
    expect(parsed).toMatchObject({
      name: "The merchant's name",
      location: {
        city: "The merchant's city",
        state: "The merchant's state",
        country: "The merchant's country",
      },
    });
  });

  it("includes shopping centers", () => {
    const shoppingCenter = prompt
      .match(/<shopping-center>(.*?)<\/shopping-center>/ms)?.[1]
      .replace(/<space>(.*?)<\/space>/gms, "");
    invariant(shoppingCenter, "Shopping center not found");
    const props = Object.fromEntries(
      shoppingCenter
        .trim()
        .split("\n")
        .map((line) => line.trim().split(": ")),
    );
    expect(props).toMatchObject({
      Name: "Westfield Mall",
      Address: "123 Main St",
      Description: "Premier shopping destination",
    });
  });

  it("includes spaces in shopping centers", () => {
    const space = prompt
      .match(/<shopping-center>(.*?)<\/shopping-center>/ms)?.[1]
      .match(/<space>(.*?)<\/space>/ms)?.[1];
    invariant(space, "Space not found");
    const props = Object.fromEntries(
      space
        .trim()
        .split("\n")
        .map((line) => line.trim().split(": ")),
    );
    expect(props).toMatchObject({
      Name: "Storefront A",
      Details: "High-traffic corner space",
      Cost: "2500",
      "Foot Traffic": "5000",
      Size: "800",
      Available: "Yes",
    });
  });

  it("handles empty properties list", () => {
    const result = systemPrompt({ userProfile, properties: [] });
    expect(result).toContain(
      "I don't know where you are, so I can't find any shopping centers near you",
    );
    expect(result).not.toContain("<shopping-center>");
  });

  it("includes instructions about known shopping centers only", () => {
    expect(prompt).toContain("within 20 miles of the user");
    expect(prompt).toContain(
      "These are all the shopping centers you know about",
    );
    expect(prompt).toContain(
      "You do not know about any other shopping centers",
    );
    expect(prompt).toContain(
      "Do not make up information about shopping centers you do not know about",
    );
  });
});

const sampleProperties = [
  {
    id: "1",
    name: "Westfield Mall",
    address: "123 Main St",
    city: "Los Angeles",
    state: "CA",
    country: "USA",
    description: "Premier shopping destination",
    imageURLs: ["https://example.com/mall.jpg"],
    latitude: 34.0522,
    longitude: -118.2437,
    createdAt: new Date(),
    updatedAt: new Date(),
    slug: "westfield-mall",
    website: "https://westfield.com",
    spaces: [
      {
        id: "space-1",
        name: "Storefront A",
        details: "High-traffic corner space",
        cost: 2500,
        footTraffic: 5000,
        size: 800,
        available: "Yes",
        imageURLs: ["https://example.com/space-a.jpg"],
        propertyId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "space-2",
        name: "Kiosk B",
        details: "Central mall location",
        cost: 1200,
        footTraffic: 3000,
        size: 200,
        available: "Yes",
        imageURLs: [],
        propertyId: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
  {
    id: "2",
    name: "Downtown Plaza",
    address: "456 Oak Ave",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    description: "Urban retail space",
    imageURLs: [],
    latitude: 37.7749,
    longitude: -122.4194,
    createdAt: new Date(),
    updatedAt: new Date(),
    slug: "downtown-plaza",
    website: "https://downtownplaza.com",
    spaces: [
      {
        id: "space-3",
        name: "Pop-up Space",
        details: "Flexible short-term rental",
        cost: 800,
        footTraffic: 1000,
        size: 400,
        available: "No",
        imageURLs: ["https://example.com/popup.jpg"],
        propertyId: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
];
