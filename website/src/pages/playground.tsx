import React from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

function PlaygroundContent() {
  // Dynamic import to avoid SSR issues with Monaco
  const Playground = require('../components/Playground').default;
  return <Playground />;
}

export default function PlaygroundPage(): JSX.Element {
  return (
    <Layout
      title="Playground"
      description="Interactive Kodeblok playground - visualize semantic insights in Kotlin code"
    >
      <BrowserOnly fallback={<div style={{ padding: '2rem' }}>Loading playground...</div>}>
        {() => <PlaygroundContent />}
      </BrowserOnly>
    </Layout>
  );
}
