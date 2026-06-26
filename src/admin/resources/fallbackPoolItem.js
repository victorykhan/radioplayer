export const fallbackPoolItemResource = {
  options: {
    navigation: { name: 'Fallback Pool', icon: 'Emergency' },
    properties: {
      contentType: {
        availableValues: [
          { value: 'track', label: 'Track' },
          { value: 'station_id', label: 'Station ID' },
          { value: 'silence', label: 'Silence Filler' },
        ],
      },
    },
  },
};
