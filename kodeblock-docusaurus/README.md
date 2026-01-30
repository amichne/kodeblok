# Kodeblok Viewer

A portable React code viewer for Kotlin snippets with semantic insights, optimized for use in Docusaurus docs.

## Install

```bash
pnpm add kodeblok
```

## Usage

```tsx
import "kodeblok/styles.css";
import { Kodeblok, type SemanticProfile } from "kodeblok";

export function Example({ snippet }: { snippet: SemanticProfile }) {
  return (
    <Kodeblok snippet={snippet} height={520} />
  );
}
```

## Docusaurus notes

- The component lazy-loads Monaco on the client; server-side renders a lightweight `<pre>` fallback.
- Ensure the container has an explicit height via the `height` prop or a parent container.

## Build

```bash
pnpm build
```

## Demo (Vite)

```bash
pnpm build
cd demo
pnpm install
pnpm dev
```
