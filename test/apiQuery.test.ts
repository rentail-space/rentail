import { expect } from "playwright/test";
import { beforeAll, describe, it } from "vitest";
import { port } from "./helpers/launchBrowser";

describe("/api/query endpoint", () => {
  // biome-ignore lint/suspicious/noExplicitAny: Test data structure is dynamic
  let responseJson: any;

  beforeAll(async () => {
    const response = await fetch(`http://localhost:${port}/api/query`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    responseJson = await response.json();
  });

  it("should return services array", () => {
    expect(Array.isArray(responseJson.services)).toBe(true);
    expect(responseJson.services.length).toBeGreaterThan(0);
    expect(responseJson.services).toContain("Kiosk Rental");
  });

  it("should return coverage information", () => {
    expect(responseJson.coverage).toBeDefined();
    expect(typeof responseJson.coverage.states).toBe("number");
    expect(typeof responseJson.coverage.shoppingCenters).toBe("number");
    expect(typeof responseJson.coverage.availableSpaces).toBe("number");
  });

  it("should return top states with center counts", () => {
    expect(Array.isArray(responseJson.coverage.topStates)).toBe(true);
    if (responseJson.coverage.topStates.length > 0) {
      const firstState = responseJson.coverage.topStates[0];
      expect(firstState.state).toBeDefined();
      expect(typeof firstState.centerCount).toBe("number");
    }
  });

  it("should return space types with descriptions", () => {
    expect(Array.isArray(responseJson.spaceTypes)).toBe(true);
    if (responseJson.spaceTypes.length > 0) {
      const firstType = responseJson.spaceTypes[0];
      expect(firstType.type).toBeDefined();
      expect(firstType.description).toBeDefined();
      expect(firstType.typicalSize).toBeDefined();
      expect(typeof firstType.count).toBe("number");
    }
  });

  it("should return capabilities object", () => {
    expect(responseJson.capabilities).toBeDefined();
    expect(responseJson.capabilities.search).toBeDefined();
    expect(responseJson.capabilities.chat).toBeDefined();
    expect(responseJson.capabilities.filtering).toBeDefined();
    expect(responseJson.capabilities.details).toBeDefined();
  });

  it("should return data quality information", () => {
    expect(responseJson.dataQuality).toBeDefined();
    expect(responseJson.dataQuality.verifiedData).toBeDefined();
    expect(responseJson.dataQuality.structuredData).toBeDefined();
    expect(responseJson.dataQuality.updateFrequency).toBeDefined();
  });

  it("should return links object", () => {
    expect(responseJson.links).toBeDefined();
    expect(responseJson.links.website).toBe("https://rentail.space");
    expect(responseJson.links.chat).toBe("https://rentail.space/chat");
    expect(responseJson.links.openapi).toBe(
      "https://rentail.space/openapi.json",
    );
  });
});

describe("/openapi.json endpoint", () => {
  // biome-ignore lint/suspicious/noExplicitAny: OpenAPI spec structure is complex and dynamic
  let openapiSpec: any;

  beforeAll(async () => {
    const response = await fetch(`http://localhost:${port}/openapi.json`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    openapiSpec = await response.json();
  });

  it("should be valid OpenAPI 3.0 spec", () => {
    expect(openapiSpec.openapi).toBe("3.0.0");
    expect(openapiSpec.info).toBeDefined();
    expect(openapiSpec.info.title).toBe("Rentail.space API");
    expect(openapiSpec.info.version).toBe("1.0.0");
  });

  it("should document /api/query endpoint", () => {
    expect(openapiSpec.paths).toBeDefined();
    expect(openapiSpec.paths["/api/query"]).toBeDefined();
    expect(openapiSpec.paths["/api/query"].get).toBeDefined();
  });

  it("should have ServiceInfo schema", () => {
    expect(openapiSpec.components).toBeDefined();
    expect(openapiSpec.components.schemas).toBeDefined();
    expect(openapiSpec.components.schemas.ServiceInfo).toBeDefined();
  });

  it("should specify server URL", () => {
    expect(Array.isArray(openapiSpec.servers)).toBe(true);
    expect(openapiSpec.servers[0].url).toBe("https://rentail.space");
  });
});

describe("robots.txt API comment", () => {
  let robotsContent: string;

  beforeAll(async () => {
    const response = await fetch(`http://localhost:${port}/robots.txt`);
    robotsContent = await response.text();
  });

  it("should include API comment", () => {
    expect(robotsContent).toContain("API for AI assistants");
    expect(robotsContent).toContain("https://rentail.space/api/query");
  });

  it("should include OpenAPI spec comment", () => {
    expect(robotsContent).toContain("OpenAPI spec");
    expect(robotsContent).toContain("https://rentail.space/openapi.json");
  });

  it("should allow /api/query endpoint", () => {
    expect(robotsContent).toContain("Allow: /api/query");
  });
});

describe("sitemap.xml API endpoints", () => {
  let sitemapContent: string;

  beforeAll(async () => {
    const response = await fetch(`http://localhost:${port}/sitemap.xml`);
    sitemapContent = await response.text();
  });

  it("should include /api/query in sitemap", () => {
    expect(sitemapContent).toContain(
      "<loc>https://rentail.space/api/query</loc>",
    );
  });

  it("should include /openapi.json in sitemap", () => {
    expect(sitemapContent).toContain(
      "<loc>https://rentail.space/openapi.json</loc>",
    );
  });
});
