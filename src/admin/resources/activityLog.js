export const activityLogResource = {
  options: {
    navigation: { name: 'Logs', icon: 'FileText' },
    actions: {
      new: { isAccessible: false },
      edit: { isAccessible: false },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
    },
    properties: {
      logLevel: {
        availableValues: [
          { value: 'info', label: 'Info' },
          { value: 'warning', label: 'Warning' },
          { value: 'error', label: 'Error' },
          { value: 'debug', label: 'Debug' },
        ],
      },
    },
    listProperties: ['id', 'logLevel', 'event', 'description', 'source', 'createdAt'],
  },
};
