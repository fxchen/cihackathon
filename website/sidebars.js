// module.exports = {
//   someSidebar: {
//     Welcome: ['history', 'getting_started', 'judging'],
//     "Audio Samples": ['audio_samples'],
//     Code: ['python', 'matlab'],
//   },
// };
module.exports = {
  sidebar: [
    {
      type: 'doc',
      id: 'history',
    },
    {
      type: 'doc',
      id: 'team',
    },
    {
      type: 'doc',
      id: 'getting_started',
    },
    {
      type: 'doc',
      id: 'presentations',
    },
    {
      type: 'doc',
      id: 'audio_samples',
    },
    {
      type: 'category',
      label: 'Code',
      items: ['python', 'matlab'],
    },
    {
      type: 'doc',
      id: 'judging',
    },
  ],
};
