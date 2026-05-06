const {
  getActiveBackups,
  getActiveMaintenanceTasks,
  formatBackupItem,
  formatMaintenanceItem,
  truncate,
  filterBackups,
  filterMaintenanceTasks
} = require("../utils/maintenance");

describe("maintenance utils", () => {
  const mockConfig = {
    backups: {
      items: [
        { name: "Backup A", enabled: true, description: "Desc A", source: "/data", tags: ["daily"] },
        { name: "Backup B", enabled: false }
      ]
    },
    maintenance: {
      items: [
        { name: "Task A", enabled: true, frequency: "weekly", tags: ["infra"] },
        { name: "Task B", enabled: false }
      ]
    }
  };

  describe("getActiveBackups", () => {
    test("returns only enabled backups", () => {
      const result = getActiveBackups(mockConfig);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Backup A");
    });
  });

  describe("getActiveMaintenanceTasks", () => {
    test("returns only enabled tasks", () => {
      const result = getActiveMaintenanceTasks(mockConfig);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Task A");
    });
  });

  describe("formatBackupItem", () => {
    test("includes description and source", () => {
      const text = formatBackupItem(mockConfig.backups.items[0]);
      expect(text).toContain("Desc A");
      expect(text).toContain("/data");
    });

    test("returns default when empty", () => {
      const text = formatBackupItem({});
      expect(text).toBe("Sin detalles extra.");
    });
  });

  describe("formatMaintenanceItem", () => {
    test("includes frequency", () => {
      const text = formatMaintenanceItem(mockConfig.maintenance.items[0]);
      expect(text).toContain("weekly");
    });
  });

  describe("filterBackups", () => {
    test("filters by tag", () => {
      const result = filterBackups(getActiveBackups(mockConfig), "daily", null);
      expect(result).toHaveLength(1);
    });

    test("filters by search", () => {
      const result = filterBackups(getActiveBackups(mockConfig), null, "Desc");
      expect(result).toHaveLength(1);
    });
  });

  describe("filterMaintenanceTasks", () => {
    test("filters by tag", () => {
      const result = filterMaintenanceTasks(getActiveMaintenanceTasks(mockConfig), "infra", null);
      expect(result).toHaveLength(1);
    });
  });

  describe("truncate", () => {
    test("truncates long strings", () => {
      const text = "x".repeat(1000);
      expect(truncate(text, 10).endsWith("...")).toBe(true);
    });
  });
});
