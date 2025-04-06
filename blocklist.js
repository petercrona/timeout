export const mkBlocklist = (resetOn) => ({
  resetOn,
  blocked: {},
});

export const blocklistAdd = (blocklist, ip) => {
  // prevent infinite growth without removing often
  if (Object.keys(blocklist.blocked).length === blocklist.resetOn) {
    blocklist.blocked = {};
  }

  blocklist.blocked[ip] = Date.now() + 1000;
};

export const blocklistContains = (blocklist, ip) => {
  return blocklist.blocked[ip] > Date.now();
};
