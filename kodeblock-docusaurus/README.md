# Kodeblok Code Pane

A portable React code pane for Kotlin snippets with semantic insights, optimized for use in Docusaurus docs.

## Install

```bash
pnpm add kodeblok
```

## Usage

```tsx
import "kodeblok/styles.css";
import { CodePane, InsightCodeBlock, type SemanticProfile } from "kodeblok";

export function Example({ snippet }: { snippet: SemanticProfile }) {
  return (
    <div style={{ height: 520 }}>
      <CodePane snippet={snippet} />
    </div>
  );
}
```

## Minimal code block

For short snippets (no side panel), use the lightweight block:

```tsx
import "kodeblok/styles.css";
import { InsightCodeBlock, type SemanticProfile } from "kodeblok";

export function MiniExample({ snippet }: { snippet: SemanticProfile }) {
  return <InsightCodeBlock snippet={snippet} height={220} />;
}
```

## Docusaurus notes

- The component lazy-loads Monaco on the client; server-side renders a lightweight `<pre>` fallback.
- Ensure the container has an explicit height (inline style or CSS class).

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
