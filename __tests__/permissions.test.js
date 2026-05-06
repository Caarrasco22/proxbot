const {
  isPermissionsEnabled,
  isProtectedCommand,
  userHasAdminRole,
  canUseCommand,
  canUsePanelCommand,
  protectedCommandMessage,
  panelCommandName,
  getAdminRoleIds
} = require("../utils/permissions");

function mockInteraction(roleIds = []) {
  return {
    commandName: "proxmox",
    member: {
      roles: {
        cache: {
          keys: () => roleIds[Symbol.iterator] ? roleIds : roleIds.values(),
          [Symbol.iterator]: function* () {
            for (const id of roleIds) {
              yield id;
            }
          }
        }
      }
    }
  };
}

// discord.js Collection-like mock
function mockCollection(ids) {
  return {
    cache: {
      keys: () => ids.values(),
      [Symbol.iterator]: function* () {
        for (const id of ids) {
          yield id;
        }
      }
    }
  };
}

describe("permissions utils", () => {
  const configEnabled = {
    permissions: {
      enabled: true,
      adminRoleIds: ["admin123"],
      protectedCommands: ["proxmox", "ssh"]
    }
  };

  const configDisabled = {
    permissions: {
      enabled: false,
      adminRoleIds: [],
      protectedCommands: ["proxmox"]
    }
  };

  describe("isPermissionsEnabled", () => {
    test("returns true when enabled", () => {
      expect(isPermissionsEnabled(configEnabled)).toBe(true);
    });

    test("returns false when disabled", () => {
      expect(isPermissionsEnabled(configDisabled)).toBe(false);
    });
  });

  describe("getAdminRoleIds", () => {
    test("returns admin role ids", () => {
      expect(getAdminRoleIds(configEnabled)).toEqual(["admin123"]);
    });
  });

  describe("isProtectedCommand", () => {
    test("returns true for protected command", () => {
      expect(isProtectedCommand(configEnabled, "proxmox")).toBe(true);
    });

    test("returns false for non-protected command", () => {
      expect(isProtectedCommand(configEnabled, "ping")).toBe(false);
    });
  });

  describe("userHasAdminRole", () => {
    test("returns true if user has admin role", () => {
      const interaction = { member: { roles: mockCollection(["admin123", "user456"]) } };
      expect(userHasAdminRole(interaction, configEnabled)).toBe(true);
    });

    test("returns false if user lacks admin role", () => {
      const interaction = { member: { roles: mockCollection(["user456"]) } };
      expect(userHasAdminRole(interaction, configEnabled)).toBe(false);
    });

    test("returns false when no admin roles configured", () => {
      const interaction = { member: { roles: mockCollection(["admin123"]) } };
      expect(userHasAdminRole(interaction, configDisabled)).toBe(false);
    });

    test("returns false when no member roles", () => {
      expect(userHasAdminRole({ member: {} }, configEnabled)).toBe(false);
    });
  });

  describe("canUseCommand", () => {
    test("allows any command when permissions disabled", () => {
      const interaction = mockInteraction([]);
      expect(canUseCommand(interaction, configDisabled)).toBe(true);
    });

    test("allows non-protected command even without role", () => {
      const interaction = mockInteraction(["user456"]);
      Object.defineProperty(interaction, "commandName", { value: "ping", writable: true });
      expect(canUseCommand(interaction, configEnabled)).toBe(true);
    });

    test("blocks protected command without admin role", () => {
      const interaction = mockInteraction(["user456"]);
      Object.defineProperty(interaction, "commandName", { value: "proxmox", writable: true });
      expect(canUseCommand(interaction, configEnabled)).toBe(false);
    });

    test("allows protected command with admin role", () => {
      const interaction = mockInteraction(["admin123"]);
      Object.defineProperty(interaction, "commandName", { value: "proxmox", writable: true });
      expect(canUseCommand(interaction, configEnabled)).toBe(true);
    });
  });

  describe("canUsePanelCommand", () => {
    test("behaves like canUseCommand for panel commands", () => {
      const interaction = mockInteraction(["user456"]);
      expect(canUsePanelCommand(interaction, configEnabled, "proxmox")).toBe(false);
      expect(canUsePanelCommand(interaction, configEnabled, "ping")).toBe(true);
    });
  });

  describe("protectedCommandMessage", () => {
    test("includes command name", () => {
      expect(protectedCommandMessage("ssh")).toContain("ssh");
    });
  });

  describe("panelCommandName", () => {
    test("extracts command name from panel customId", () => {
      expect(panelCommandName("panel_ssh")).toBe("ssh");
    });

    test("returns null for non-panel ids", () => {
      expect(panelCommandName("other_thing")).toBeNull();
    });
  });
});
