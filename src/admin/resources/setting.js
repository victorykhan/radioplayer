export const settingResource = {
  options: {
    navigation: { name: 'Settings', icon: 'Settings' },
    properties: {
      value: { type: 'textarea' },
      type: {
        availableValues: [
          { value: 'string', label: 'String' },
          { value: 'json', label: 'JSON' },
          { value: 'number', label: 'Number' },
          { value: 'boolean', label: 'Boolean' },
        ],
      },
    },
  },
};
