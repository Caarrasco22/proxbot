const {
  getActiveServices,
  getInventorySummary,
  getInventoryFacets,
  findServices,
  findServiceByName,
  formatServiceDetails,
  truncate
} = require("../utils/inventory");

describe("inventory utils", () => {
  const mockConfig = {
    services: [
      { name: "Web", enabled: true, url: "http://web.lab", host: "10.0.0.1", port: 80, check: true, category: "app", tags: ["web", "prod"] },
      { name: "DB", enabled: false, url: "", host: "10.0.0.2", port: 5432, check: false, category: "infra", tags: ["db"] },
      { name: "DNS", enabled: true, check: true, category: "infra", tags: ["infra"] }
    ]
  };

  describe("getActiveServices", () => {
    test("returns only enabled services", () => {
      const result = getActiveServices(mockConfig);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.name)).toEqual(["Web", "DNS"]);
    });

    test("returns empty array when no services", () => {
      expect(getActiveServices({})).toEqual([]);
    });
  });

  describe("getInventorySummary", () => {
    test("counts services correctly", () => {
      const services = getActiveServices(mockConfig);
      const summary = getInventorySummary(mockConfig, services);
      expect(summary.total).toBe(2);
      expect(summary.withUrl).toBe(1);
      expect(summary.withHost).toBe(1);
      expect(summary.withPort).toBe(1);
      expect(summary.withCheck).toBe(2);
    });
  });

  describe("getInventoryFacets", () => {
    test("aggregates categories and tags", () => {
      const services = getActiveServices(mockConfig);
      const facets = getInventoryFacets(services);
      expect(facets.categories).toContainEqual({ name: "infra", count: 1 });
      expect(facets.categories).toContainEqual({ name: "app", count: 1 });
      expect(facets.tags).toContainEqual({ name: "infra", count: 1 });
      expect(facets.tags).toContainEqual({ name: "web", count: 1 });
    });
  });

  describe("findServices", () => {
    test("filters by tag", () => {
      const result = findServices(mockConfig, { tag: "web" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Web");
    });

    test("filters by category", () => {
      const result = findServices(mockConfig, { category: "infra" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("DNS");
    });

    test("filters by search", () => {
      const result = findServices(mockConfig, { search: "web" });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Web");
    });
  });

  describe("findServiceByName", () => {
    test("finds exact match", () => {
      const result = findServiceByName(mockConfig, "Web");
      expect(result.exactMatch).not.toBeNull();
      expect(result.exactMatch.name).toBe("Web");
    });

    test("finds partial matches", () => {
      const result = findServiceByName(mockConfig, "D");
      expect(result.exactMatch).toBeNull();
      expect(result.partialMatches.length).toBeGreaterThan(0);
    });

    test("returns empty on empty query", () => {
      const result = findServiceByName(mockConfig, "");
      expect(result.exactMatch).toBeNull();
      expect(result.partialMatches).toEqual([]);
    });
  });

  describe("formatServiceDetails", () => {
    test("formats service details", () => {
      const service = mockConfig.services[0];
      const text = formatServiceDetails(service);
      expect(text).toContain("Web");
      expect(text).toContain("10.0.0.1");
    });

    test("redacts sensitive values", () => {
      const text = formatServiceDetails({ name: "X", url: "token=secret123" });
      expect(text).toContain("[redacted]");
    });
  });

  describe("truncate", () => {
    test("returns short text unchanged", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    test("truncates long text", () => {
      const long = "a".repeat(1000);
      expect(truncate(long, 10)).toBe("a".repeat(7) + "...");
    });
  });
});
