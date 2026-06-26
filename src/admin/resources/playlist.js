export const playlistResource = {
  options: {
    navigation: { name: 'Playlists', icon: 'Playlist' },
    properties: {
      description: { type: 'textarea' },
      type: {
        availableValues: [
          { value: 'rotation', label: 'Rotation' },
          { value: 'manual', label: 'Manual' },
          { value: 'scheduled', label: 'Scheduled' },
        ],
      },
    },
  },
};
