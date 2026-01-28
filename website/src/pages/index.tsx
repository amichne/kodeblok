import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            style={{marginLeft: '1rem'}}
            to="/playground">
            Try Playground
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: JSX.Element;
  color: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Type Inference',
    description: (
      <>
        See exactly what types the Kotlin compiler infers for your variables,
        expressions, and generic type arguments.
      </>
    ),
    color: '#22d3ee',
  },
  {
    title: 'Smart Casts',
    description: (
      <>
        Understand when and why Kotlin automatically narrows types based on
        null checks, is-checks, and control flow analysis.
      </>
    ),
    color: '#4ade80',
  },
  {
    title: 'Scope Functions',
    description: (
      <>
        Visualize how scope functions like let, run, with, apply, and also
        change the receiver and 'it' context.
      </>
    ),
    color: '#c084fc',
  },
  {
    title: 'Extensions',
    description: (
      <>
        Track extension function and property resolution, including where
        they're resolved from and member shadowing.
      </>
    ),
    color: '#60a5fa',
  },
  {
    title: 'Lambdas',
    description: (
      <>
        See inferred parameter types, return types, and SAM conversions
        in lambda expressions.
      </>
    ),
    color: '#facc15',
  },
  {
    title: 'Overload Resolution',
    description: (
      <>
        Understand which function overload was selected and why, including
        candidate counts and resolution factors.
      </>
    ),
    color: '#f87171',
  },
];

function Feature({title, description, color}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md" style={{marginBottom: '2rem'}}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block',
            marginBottom: '0.5rem',
          }}
        />
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className="text--center" style={{marginBottom: '2rem'}}>
          Insight Categories
        </h2>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Semantic Insights for Kotlin`}
      description="Visualize what the Kotlin compiler sees - type inference, smart casts, scope functions, and more">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
