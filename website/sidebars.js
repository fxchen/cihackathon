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
      type: 'category',
      label: 'About',
      items: ['history', 'team'],
    },
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting_started', 'presentations', 'audio_samples'],
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
