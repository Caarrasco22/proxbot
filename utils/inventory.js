const MAX_DETAIL_LENGTH = 3800;
const MAX_FIELD_VALUE_LENGTH = 950;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function truncate(value, maxLength = MAX_FIELD_VALUE_LENGTH) {
  const text = String(value || "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(maxLength - 3, 0))}...`;
}

function isService(service) {
  return service && typeof service === "object" && !Array.isArray(service);
}

function getServices(config) {
  return asArray(config && config.services).filter(isService);
}

function getActiveServices(config) {
  return getServices(config).filter(service => service.enabled !== false);
}

function serviceCategory(service) {
  return service.category || service.categoria || "";
}

function serviceNotes(service) {
  return service.notes || service.notas || "";
}

function serviceTags(service) {
  return asArray(service.tags).filter(tag => typeof tag === "string" && tag.trim());
}

function booleanLabel(value) {
  return value === true ? "true" : "false";
}

function maybeSensitive(value) {
  return /(password|passwd|secret|token|api[_-]?key)=/i.test(String(value || ""));
}

function safeValue(value) {
  if (maybeSensitive(value)) {
    return "[redacted]";
  }

  return value;
}

function getInventorySummary(config, services = getActiveServices(config)) {
  const list = asArray(services).filter(isService);

  return {
    total: list.length,
    withUrl: list.filter(service => service.url).length,
    withHost: list.filter(service => service.host).length,
    withPort: list.filter(service => service.port).length,
    withCheck: list.filter(service => service.check === true).length
  };
}

function getInventoryFacets(services = []) {
  const categories = new Map();
  const tags = new Map();

  asArray(services).filter(isService).forEach(service => {
    const category = serviceCategory(service);

    if (category) {
      const key = category.trim();
      categories.set(key, (categories.get(key) || 0) + 1);
    }

    serviceTags(service).forEach(tag => {
      const key = tag.trim();
      tags.set(key, (tags.get(key) || 0) + 1);
    });
  });

  const sortEntries = entries => [...entries]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  return {
    categories: sortEntries(categories.entries()),
    tags: sortEntries(tags.entries())
  };
}

function matchesTag(service, tag) {
  if (!tag) {
    return true;
  }

  const expected = normalize(tag);
  return serviceTags(service).some(item => normalize(item) === expected);
}

function matchesCategory(service, category) {
  if (!category) {
    return true;
  }

  return normalize(serviceCategory(service)).includes(normalize(category));
}

function searchableText(service) {
  return [
    service.name,
    service.description,
    service.host,
    service.port,
    service.url,
    service.ssh,
    serviceCategory(service),
    service.owner,
    service.location,
    serviceNotes(service),
    ...serviceTags(service)
  ].filter(Boolean).join(" ");
}

function matchesSearch(service, search) {
  if (!search) {
    return true;
  }

  return normalize(searchableText(service)).includes(normalize(search));
}

function findServices(config, filters = {}) {
  const tag = filters.tag;
  const category = filters.category || filters.categoria;
  const search = filters.search || filters.buscar;

  return getActiveServices(config).filter(service =>
    matchesTag(service, tag) &&
    matchesCategory(service, category) &&
    matchesSearch(service, search)
  );
}

function findServiceByName(config, name) {
  const query = normalize(name);
  const services = getServices(config);

  if (!query) {
    return {
      exactMatch: null,
      partialMatches: []
    };
  }

  const exactMatch = services.find(service => normalize(service.name) === query) || null;

  if (exactMatch) {
    return {
      exactMatch,
      partialMatches: [exactMatch]
    };
  }

  return {
    exactMatch: null,
    partialMatches: services.filter(service => normalize(service.name).includes(query))
  };
}

function formatLine(label, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return `**${label}:** ${safeValue(value)}`;
}

function formatServiceDetails(service) {
  if (!isService(service)) {
    return "Servicio no valido.";
  }

  const tags = serviceTags(service);
  const lines = [
    formatLine("Nombre", service.name),
    formatLine("Descripcion", service.description),
    formatLine("Host", service.host),
    formatLine("Puerto", service.port),
    formatLine("URL", service.url),
    formatLine("SSH", service.ssh),
    formatLine("Categoria", serviceCategory(service)),
    formatLine("Owner", service.owner),
    formatLine("Location", service.location),
    tags.length > 0 ? formatLine("Tags", tags.join(", ")) : null,
    formatLine("Check", booleanLabel(service.check === true)),
    formatLine("Enabled", booleanLabel(service.enabled !== false)),
    formatLine("Notas", serviceNotes(service))
  ].filter(Boolean);

  return truncate(lines.join("\n"), MAX_DETAIL_LENGTH);
}

function formatServiceListItem(service) {
  const tags = serviceTags(service);
  const parts = [
    service.description,
    service.host ? `Host: ${safeValue(service.host)}` : null,
    service.port ? `Puerto: ${safeValue(service.port)}` : null,
    service.url ? `URL: ${safeValue(service.url)}` : null,
    serviceCategory(service) ? `Categoria: ${serviceCategory(service)}` : null,
    tags.length > 0 ? `Tags: ${tags.join(", ")}` : null,
    `Check: ${booleanLabel(service.check === true)}`
  ].filter(Boolean);

  return truncate(parts.join("\n") || "Sin detalles extra");
}

module.exports = {
  getActiveServices,
  getInventorySummary,
  getInventoryFacets,
  findServices,
  findServiceByName,
  formatServiceDetails,
  formatServiceListItem,
  truncate
};
