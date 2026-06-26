export const userResource = {
  options: {
    navigation: { name: 'Admin', icon: 'User' },
    properties: {
      password: { type: 'password', isVisible: { list: false, edit: true, show: false } },
      role: {
        availableValues: [
          { value: 'admin', label: 'Admin' },
          { value: 'dj', label: 'DJ' },
          { value: 'manager', label: 'Manager' },
        ],
      },
    },
    actions: {
      new: {
        before: async (request) => {
          if (request.payload?.password) {
            const bcrypt = await import('bcrypt');
            request.payload.password = await bcrypt.hash(request.payload.password, 12);
          }
          return request;
        },
      },
      edit: {
        before: async (request) => {
          if (request.payload?.password) {
            const bcrypt = await import('bcrypt');
            request.payload.password = await bcrypt.hash(request.payload.password, 12);
          } else {
            delete request.payload?.password;
          }
          return request;
        },
      },
    },
  },
};
