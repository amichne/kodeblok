import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/usage'],
    },
    {
      type: 'category',
      label: 'Insight Categories',
      items: [
        'insights/type-inference',
        'insights/nullability',
        'insights/smart-casts',
        'insights/scoping',
        'insights/extensions',
        'insights/lambdas',
        'insights/overloads',
      ],
    },
  ],
};

export default sidebars;
