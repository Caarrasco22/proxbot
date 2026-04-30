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
