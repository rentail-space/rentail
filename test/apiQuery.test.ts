import { beforeAll, describe, it } from "vite-plus/test";
import { BASE_URL } from "./helpers/launchServer";
import { expect } from "playwright/test";

describe("/api/query endpoint", () => {
  let json: {
    services: string[];
    coverage: {
      states: number;
      shoppingCenters: number;
      availableSpaces: number;
      topStates: { state: string; centerCount: number }[];
    };
    spaceTypes: {
      type: string;
      description: string;
      typicalSize: string;
      count: number;
    }[];
    capabilities: {
      search: string;
      chat: string;
      filtering: string;
      details: string;
    };
    dataQuality: {
      verifiedData: string;
      structuredData: string;
      updateFrequency: string;
    };
    links: { website: string; chat: string; openapi: string };
  };

  beforeAll(async () => {
    const response = await fetch(`${BASE_URL}api/query`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    json = await response.json();
  });

  it("should return services array", () => {
    expect(Array.isArray(json.services)).toBe(true);
    expect(json.services.length).toBeGreaterThan(0);
    expect(json.services).toContain("Kiosk Rental");
  });

  it("should return coverage information", () => {
    expect(json.coverage).toBeDefined();
    expect(typeof json.coverage.states).toBe("number");
    expect(typeof json.coverage.shoppingCenters).toBe("number");
    expect(typeof json.coverage.availableSpaces).toBe("number");
  });

  it("should return top states with center counts", () => {
    expect(Array.isArray(json.coverage.topStates)).toBe(true);
    if (json.coverage.topStates.length > 0) {
      const firstState = json.coverage.topStates[0];
      expect(firstState.state).toBeDefined();
      expect(typeof firstState.centerCount).toBe("number");
    }
  });

  it("should return space types with descriptions", () => {
    expect(Array.isArray(json.spaceTypes)).toBe(true);
    if (json.spaceTypes.length > 0) {
      const firstType = json.spaceTypes[0];
      expect(firstType.type).toBeDefined();
      expect(firstType.description).toBeDefined();
      expect(firstType.typicalSize).toBeDefined();
      expect(typeof firstType.count).toBe("number");
    }
  });

  it("should return capabilities object", () => {
    expect(json.capabilities).toBeDefined();
    expect(json.capabilities.search).toBeDefined();
    expect(json.capabilities.chat).toBeDefined();
    expect(json.capabilities.filtering).toBeDefined();
    expect(json.capabilities.details).toBeDefined();
  });

  it("should return data quality information", () => {
    expect(json.dataQuality).toBeDefined();
    expect(json.dataQuality.verifiedData).toBeDefined();
    expect(json.dataQuality.structuredData).toBeDefined();
    expect(json.dataQuality.updateFrequency).toBeDefined();
  });

  it("should return links object", () => {
    expect(json.links).toBeDefined();
    expect(json.links.website).toBe("https://rentail.space");
    expect(json.links.chat).toBe("https://rentail.space/chat");
    expect(json.links.openapi).toBe("https://rentail.space/openapi.json");
  });
});

describe("/openapi.json endpoint", () => {
  let spec: {
    openapi: string;
    info: {
      title: string;
      description: string;
      version: string;
      contact: {
        email: string;
        url: string;
      };
    };
    paths: {
      "/api/query": {
        get: {
          responses: {
            "200": {
              content: { "application/json": { schema: { type: "object" } } };
            };
          };
        };
      };
    };
    components: {
      schemas: {
        ServiceInfo: {
          type: "object";
        };
      };
    };
    servers: { url: string }[];
  };

  beforeAll(async () => {
    const response = await fetch(`${BASE_URL}openapi.json`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    spec = await response.json();
  });

  it("should be valid OpenAPI 3.0 spec", () => {
    expect(spec.openapi).toBe("3.0.0");
    expect(spec.info).toBeDefined();
    expect(spec.info.title).toBe("Rentail.space API");
    expect(spec.info.version).toBe("1.0.0");
  });

  it("should document /api/query endpoint", () => {
    expect(spec.paths).toBeDefined();
    expect(spec.paths["/api/query"]).toBeDefined();
    expect(spec.paths["/api/query"].get).toBeDefined();
  });

  it("should have ServiceInfo schema", () => {
    expect(spec.components).toBeDefined();
    expect(spec.components.schemas).toBeDefined();
    expect(spec.components.schemas.ServiceInfo).toBeDefined();
  });

  it("should specify server URL", () => {
    expect(Array.isArray(spec.servers)).toBe(true);
    expect(spec.servers[0].url).toBe("https://rentail.space");
  });
});
