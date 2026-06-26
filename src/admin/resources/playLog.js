export const playLogResource = {
  options: {
    navigation: { name: 'Logs', icon: 'FileText' },
    actions: {
      new: { isAccessible: false },
      edit: { isAccessible: false },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
    },
    properties: {
      playedAt: { type: 'datetime' },
    },
  },
};
