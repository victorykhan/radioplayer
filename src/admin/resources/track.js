export const trackResource = {
  options: {
    navigation: { name: 'Music Library', icon: 'Music' },
    properties: {
      filePath: { isVisible: { list: false, edit: true, show: true } },
      fileHash: { isVisible: { list: false, edit: true, show: true } },
      lyrics: { type: 'textarea' },
      displayTitle: { type: 'string' },
      displayArtist: { type: 'string' },
      duration: {
        type: 'string',
        resolve: (row) => row.duration
          ? new Date(row.duration * 1000).toISOString().substr(14, 5)
          : '-',
      },
      fileSize: {
        type: 'string',
        resolve: (row) => row.fileSize
          ? (row.fileSize / 1048576).toFixed(1) + ' MB'
          : '-',
      },
      type: {
        availableValues: [
          { value: 'song', label: 'Song' },
          { value: 'ad', label: 'Ad' },
          { value: 'jingle', label: 'Jingle' },
          { value: 'station_id', label: 'Station ID' },
          { value: 'filler', label: 'Filler' },
        ],
      },
      status: {
        availableValues: [
          { value: 'active', label: 'Active' },
          { value: 'non_playable', label: 'Non-Playable' },
          { value: 'archived', label: 'Archived' },
        ],
      },
    },
    sort: { direction: 'desc', sortBy: 'createdAt' },
  },
};
