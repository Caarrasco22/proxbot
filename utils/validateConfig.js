function validateConfig(config) {
  const errors = [];
  const warnings = [];

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    errors.push("config.json debe contener un objeto JSON.");
    return { valid: false, errors, warnings };
  }

  if (!config.bot || typeof config.bot !== "object" || Array.isArray(config.bot)) {
    errors.push("Falta la seccion obligatoria `bot`.");
  }

  if (config.network !== undefined) {
    if (!config.network || typeof config.network !== "object" || Array.isArray(config.network)) {
      warnings.push("`network` deberia ser un objeto.");
    } else if (config.network.items !== undefined) {
      if (!Array.isArray(config.network.items)) {
        warnings.push("`network.items` deberia ser un array.");
      } else {
        config.network.items.forEach((item, index) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) {
            warnings.push(`network.items[${index}] deberia ser un objeto.`);
            return;
          }

          if (!item.name || !item.value) {
            warnings.push(`network.items[${index}] deberia tener name y value.`);
          }
        });
      }
    }
  }

  if (config.permissions !== undefined) {
    if (!config.permissions || typeof config.permissions !== "object" || Array.isArray(config.permissions)) {
      warnings.push("`permissions` deberia ser un objeto.");
    } else {
      if (
        config.permissions.enabled !== undefined &&
        typeof config.permissions.enabled !== "boolean"
      ) {
        warnings.push("`permissions.enabled` deberia ser boolean.");
      }

      if (config.permissions.adminRoleIds !== undefined) {
        if (!Array.isArray(config.permissions.adminRoleIds)) {
          warnings.push("`permissions.adminRoleIds` deberia ser un array.");
        } else {
          config.permissions.adminRoleIds.forEach((roleId, index) => {
            if (typeof roleId !== "string") {
              warnings.push(`\`permissions.adminRoleIds[${index}]\` deberia ser un string.`);
            }
          });

          if (
            config.permissions.enabled === true &&
            config.permissions.adminRoleIds.length === 0
          ) {
            warnings.push("`permissions.enabled` es true pero `adminRoleIds` esta vacio. Los comandos protegidos estaran bloqueados para todos.");
          }
        }
      }

      if (config.permissions.protectedCommands !== undefined) {
        if (!Array.isArray(config.permissions.protectedCommands)) {
          warnings.push("`permissions.protectedCommands` deberia ser un array.");
        } else {
          config.permissions.protectedCommands.forEach((cmd, index) => {
            if (typeof cmd !== "string") {
              warnings.push(`\`permissions.protectedCommands[${index}]\` deberia ser un string.`);
            }
          });
        }
      }
    }
  }

  if (config.integrations !== undefined) {
    if (!config.integrations || typeof config.integrations !== "object" || Array.isArray(config.integrations)) {
      warnings.push("`integrations` deberia ser un objeto.");
    } else {
      if (config.integrations.proxmox !== undefined) {
        const proxmox = config.integrations.proxmox;

        if (!proxmox || typeof proxmox !== "object" || Array.isArray(proxmox)) {
          warnings.push("`integrations.proxmox` deberia ser un objeto.");
        } else {
          if (proxmox.enabled !== undefined && typeof proxmox.enabled !== "boolean") {
            warnings.push("`integrations.proxmox.enabled` deberia ser boolean.");
          }

          if (proxmox.url !== undefined && typeof proxmox.url !== "string") {
            warnings.push("`integrations.proxmox.url` deberia ser un string.");
          }

          if (proxmox.tokenEnv !== undefined && typeof proxmox.tokenEnv !== "string") {
            warnings.push("`integrations.proxmox.tokenEnv` deberia ser un string.");
          }

          if (proxmox.realm !== undefined && typeof proxmox.realm !== "string") {
            warnings.push("`integrations.proxmox.realm` deberia ser un string.");
          }

          if (proxmox.timeoutMs !== undefined) {
            if (typeof proxmox.timeoutMs !== "number" || proxmox.timeoutMs < 1000) {
              warnings.push("`integrations.proxmox.timeoutMs` deberia ser un numero mayor o igual a 1000.");
            }
          }

          if (proxmox.rejectUnauthorized !== undefined && typeof proxmox.rejectUnauthorized !== "boolean") {
            warnings.push("`integrations.proxmox.rejectUnauthorized` deberia ser boolean.");
          }

          if (proxmox.cacheTtlSeconds !== undefined) {
            if (typeof proxmox.cacheTtlSeconds !== "number" || proxmox.cacheTtlSeconds < 0) {
              warnings.push("`integrations.proxmox.cacheTtlSeconds` deberia ser un numero mayor o igual a 0.");
            }
          }

          if (proxmox.enabled === true) {
            if (!proxmox.url || !String(proxmox.url).trim()) {
              warnings.push("`integrations.proxmox.enabled` es true pero `url` esta vacia.");
            }

            if (!proxmox.tokenEnv || !String(proxmox.tokenEnv).trim()) {
              warnings.push("`integrations.proxmox.enabled` es true pero `tokenEnv` esta vacio.");
            }
          }
        }
      }
    }
  }

  if (config.diagnostics !== undefined) {
    if (!config.diagnostics || typeof config.diagnostics !== "object" || Array.isArray(config.diagnostics)) {
      warnings.push("`diagnostics` deberia ser un objeto.");
    } else {
      if (
        config.diagnostics.portTimeoutMs !== undefined &&
        typeof config.diagnostics.portTimeoutMs !== "number"
      ) {
        warnings.push("`diagnostics.portTimeoutMs` deberia ser un numero.");
      }

      if (
        config.diagnostics.urlTimeoutMs !== undefined &&
        typeof config.diagnostics.urlTimeoutMs !== "number"
      ) {
        warnings.push("`diagnostics.urlTimeoutMs` deberia ser un numero.");
      }
    }
  }

  if (config.monitoring !== undefined) {
    if (!config.monitoring || typeof config.monitoring !== "object" || Array.isArray(config.monitoring)) {
      warnings.push("`monitoring` deberia ser un objeto.");
    } else {
      if (
        config.monitoring.enabled !== undefined &&
        typeof config.monitoring.enabled !== "boolean"
      ) {
        warnings.push("`monitoring.enabled` deberia ser boolean.");
      }

      if (
        config.monitoring.intervalMinutes !== undefined &&
        (
          typeof config.monitoring.intervalMinutes !== "number" ||
          config.monitoring.intervalMinutes < 1
        )
      ) {
        warnings.push("`monitoring.intervalMinutes` deberia ser un numero mayor o igual a 1.");
      }

      if (
        config.monitoring.alertChannelId !== undefined &&
        typeof config.monitoring.alertChannelId !== "string"
      ) {
        warnings.push("`monitoring.alertChannelId` deberia ser string.");
      }

      if (
        config.monitoring.notifyOnlyOnChange !== undefined &&
        typeof config.monitoring.notifyOnlyOnChange !== "boolean"
      ) {
        warnings.push("`monitoring.notifyOnlyOnChange` deberia ser boolean.");
      }

      if (
        config.monitoring.runOnStartup !== undefined &&
        typeof config.monitoring.runOnStartup !== "boolean"
      ) {
        warnings.push("`monitoring.runOnStartup` deberia ser boolean.");
      }
    }
  }

  function validateItemsArray(sectionName, items, expectedStringFields) {
    if (items === undefined) return;

    if (!Array.isArray(items)) {
      warnings.push(`\`${sectionName}.items\` deberia ser un array.`);
      return;
    }

    items.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        warnings.push(`${sectionName}.items[${index}] deberia ser un objeto.`);
        return;
      }

      if (!item.name) {
        warnings.push(`${sectionName}.items[${index}] no tiene name.`);
      }

      if (item.enabled !== undefined && typeof item.enabled !== "boolean") {
        warnings.push(`${sectionName}.items[${index}].enabled deberia ser boolean.`);
      }

      if (item.tags !== undefined && !Array.isArray(item.tags)) {
        warnings.push(`${sectionName}.items[${index}].tags deberia ser un array.`);
      }

      expectedStringFields.forEach(field => {
        if (item[field] !== undefined && typeof item[field] !== "string") {
          warnings.push(`${sectionName}.items[${index}].${field} deberia ser un string.`);
        }
      });
    });
  }

  if (config.maintenance !== undefined) {
    if (!config.maintenance || typeof config.maintenance !== "object" || Array.isArray(config.maintenance)) {
      warnings.push("`maintenance` deberia ser un objeto.");
    } else if (config.maintenance.items !== undefined) {
      validateItemsArray("maintenance", config.maintenance.items, [
        "name", "description", "frequency", "frecuencia", "target",
        "owner", "priority", "lastCheck", "notes", "notas"
      ]);
    }
  }

  if (config.backups !== undefined) {
    if (!config.backups || typeof config.backups !== "object" || Array.isArray(config.backups)) {
      warnings.push("`backups` deberia ser un objeto.");
    } else if (config.backups.items !== undefined) {
      validateItemsArray("backups", config.backups.items, [
        "name", "description", "source", "destination",
        "frequency", "frecuencia", "method", "lastTested", "notes", "notas"
      ]);
    }
  }

  if (!Array.isArray(config.services)) {
    errors.push("`services` debe ser un array.");
  } else {
    config.services.forEach((service, index) => {
      const label = `services[${index}]`;

      if (!service || typeof service !== "object" || Array.isArray(service)) {
        errors.push(`${label} debe ser un objeto.`);
        return;
      }

      if (!service.name) {
        warnings.push(`${label} no tiene name.`);
      }

      if (service.check === true && !service.url && !(service.host && service.port)) {
        warnings.push(`${label} tiene check=true pero no tiene url ni host/port.`);
      }

      if (service.port && typeof service.port !== "number") {
        warnings.push(`${label}.port deberia ser un numero.`);
      }

      if (service.tags && !Array.isArray(service.tags)) {
        warnings.push(`${label}.tags deberia ser un array.`);
      }

      [
        "category",
        "categoria",
        "owner",
        "location",
        "notes",
        "notas"
      ].forEach(field => {
        if (service[field] !== undefined && typeof service[field] !== "string") {
          warnings.push(`${label}.${field} deberia ser un string.`);
        }
      });
    });
  }

  if (config.domains !== undefined) {
    if (!Array.isArray(config.domains)) {
      errors.push("`domains` debe ser un array si existe.");
    } else {
      config.domains.forEach((domain, index) => {
        if (!domain || typeof domain !== "object" || Array.isArray(domain)) {
          warnings.push(`domains[${index}] deberia ser un objeto.`);
          return;
        }

        if (!domain.name) {
          warnings.push(`domains[${index}] no tiene name.`);
        }
      });
    }
  }

  if (config.ssh !== undefined && !Array.isArray(config.ssh)) {
    errors.push("`ssh` debe ser un array si existe.");
  }

  if (config.pending !== undefined && !Array.isArray(config.pending)) {
    errors.push("`pending` debe ser un array si existe.");
  }

  if (config.security !== undefined && !Array.isArray(config.security)) {
    errors.push("`security` debe ser un array si existe.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

module.exports = { validateConfig };
