function getPermissionsConfig(config) {
  return (config && config.permissions) || {};
}

function isPermissionsEnabled(config) {
  return getPermissionsConfig(config).enabled === true;
}

function getProtectedCommands(config) {
  const perms = getPermissionsConfig(config);
  return Array.isArray(perms.protectedCommands) ? perms.protectedCommands : [];
}

function getAdminRoleIds(config) {
  const perms = getPermissionsConfig(config);
  return Array.isArray(perms.adminRoleIds) ? perms.adminRoleIds : [];
}

function isProtectedCommand(config, commandName) {
  if (!commandName) {return false;}
  const protectedCommands = getProtectedCommands(config);
  return protectedCommands.includes(commandName);
}

function userHasAdminRole(interaction, config) {
  const adminRoleIds = getAdminRoleIds(config);

  if (adminRoleIds.length === 0) {
    return false;
  }

  const memberRoles = interaction.member?.roles;

  if (!memberRoles) {
    return false;
  }

  // discord.js v14: roles.cache is a Collection<Snowflake, Role>
  const userRoleIds = memberRoles.cache ? Array.from(memberRoles.cache.keys()) : [];

  return adminRoleIds.some(roleId => userRoleIds.includes(roleId));
}

function canUseCommand(interaction, config) {
  if (!isPermissionsEnabled(config)) {
    return true;
  }

  const commandName = interaction.commandName;

  if (!isProtectedCommand(config, commandName)) {
    return true;
  }

  return userHasAdminRole(interaction, config);
}

function canUsePanelCommand(interaction, config, commandName) {
  if (!isPermissionsEnabled(config)) {
    return true;
  }

  if (!isProtectedCommand(config, commandName)) {
    return true;
  }

  return userHasAdminRole(interaction, config);
}

function protectedCommandMessage(commandName) {
  return `El comando **\`${commandName}\`** esta restringido. Necesitas un rol de administrador configurado en \`permissions.adminRoleIds\` para usarlo.`;
}

function panelCommandName(customId) {
  if (!customId || !customId.startsWith("panel_")) {
    return null;
  }

  return customId.replace("panel_", "");
}

module.exports = {
  getPermissionsConfig,
  isPermissionsEnabled,
  isProtectedCommand,
  userHasAdminRole,
  canUseCommand,
  canUsePanelCommand,
  protectedCommandMessage,
  panelCommandName,
  getAdminRoleIds
};
