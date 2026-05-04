const MAX_FIELD_VALUE_LENGTH = 950;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function truncate(value, maxLength = MAX_FIELD_VALUE_LENGTH) {
  const text = String(value || "");

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(maxLength - 3, 0))}...`;
}

function maybeSensitive(value) {
  return /(password|passwd|secret|token|api[_-]?key|private[_-]?key|clave|contrase)/i.test(String(value || ""));
}

function safeValue(value) {
  if (maybeSensitive(value)) {
    return "[redacted]";
  }

  return value;
}

function getItemsSection(config, sectionName) {
  const section = config && config[sectionName];

  if (isObject(section) && Array.isArray(section.items)) {
    return section.items.filter(isObject);
  }

  if (Array.isArray(section)) {
    return section.filter(isObject);
  }

  return [];
}

function getBackups(config) {
  return getItemsSection(config, "backups");
}

function getActiveBackups(config) {
  return getBackups(config).filter(item => item.enabled !== false);
}

function getMaintenanceTasks(config) {
  return getItemsSection(config, "maintenance");
}

function getActiveMaintenanceTasks(config) {
  return getMaintenanceTasks(config).filter(item => item.enabled !== false);
}

function formatLine(label, value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return `**${label}:** ${safeValue(value)}`;
}

function formatBackupItem(item) {
  const lines = [
    formatLine("Descripcion", item.description || item.descripcion),
    formatLine("Tipo", item.type || item.tipo),
    formatLine("Fuente", item.source || item.fuente),
    formatLine("Frecuencia", item.frequency || item.frecuencia),
    formatLine("Destino", item.target || item.destination || item.destino),
    formatLine("Metodo", item.method || item.metodo),
    formatLine("Estado", item.status || item.estado),
    formatLine("Ultima prueba", item.lastTested || item.ultimaPrueba),
    formatLine("Ultima revision", item.lastReview || item.ultimaRevision),
    formatLine("Notas", item.notes || item.notas)
  ].filter(Boolean);

  return truncate(lines.join("\n") || "Sin detalles extra.");
}

function formatMaintenanceItem(item) {
  const lines = [
    formatLine("Descripcion", item.description || item.descripcion),
    formatLine("Frecuencia", item.frequency || item.frecuencia),
    formatLine("Objetivo", item.target || item.objetivo),
    formatLine("Responsable", item.owner || item.responsable),
    formatLine("Prioridad", item.priority || item.prioridad),
    formatLine("Ultimo check", item.lastCheck || item.ultimoCheck),
    formatLine("Notas", item.notes || item.notas)
  ].filter(Boolean);

  return truncate(lines.join("\n") || "Sin detalles extra.");
}

function matchesTag(item, tag) {
  if (!tag) return true;
  const tags = asArray(item.tags);
  return tags.some(t => String(t).toLowerCase() === tag.toLowerCase());
}

function matchesSearch(item, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  const fields = [
    item.name,
    item.description,
    item.descripcion,
    item.notes,
    item.notas,
    item.target,
    item.objetivo,
    item.source,
    item.fuente,
    item.destination,
    item.destino,
    item.owner,
    item.responsable,
    item.method,
    item.metodo
  ].filter(Boolean).map(String).map(s => s.toLowerCase());
  return fields.some(f => f.includes(q));
}

function filterBackups(backups, tag, search) {
  return backups.filter(b => matchesTag(b, tag) && matchesSearch(b, search));
}

function filterMaintenanceTasks(tasks, tag, search) {
  return tasks.filter(t => matchesTag(t, tag) && matchesSearch(t, search));
}

module.exports = {
  getBackups,
  getActiveBackups,
  getMaintenanceTasks,
  getActiveMaintenanceTasks,
  formatBackupItem,
  formatMaintenanceItem,
  truncate,
  filterBackups,
  filterMaintenanceTasks
};
