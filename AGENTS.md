# AGENTS.md — Hover Maps Generator (K2 + Analysis API) for Docusaurus Kotlin Snippets

## Mission
Implement a CI-friendly Kotlin tool (Gradle plugin + engine) that:
1) extracts Kotlin snippets + hover markers from docs/snippets or MDX,
2) analyzes them with Kotlin K2 + Analysis API (standalone),
3) emits deterministic JSON hover maps consumable by a Docusaurus React component.

No browser-side Kotlin compilation. No code execution in docs.

## Non-negotiables
- Pin Kotlin version (generator must use the same Kotlin version as the project; fail if mismatch).
- Deterministic ranges: output line/col in *snippet coordinates*, not wrapper coordinates.
- Fail-fast: missing marker / ambiguous target / analysis failure => task failure (CI should catch drift).
- Keep Analysis API calls isolated behind a tiny abstraction (API names change across Kotlin versions).

## Repository Layout (create these modules)
- hover-schema/
  - Kotlin data classes for JSON schema + versioning + serialization
- hover-engine/
  - extraction, marker parsing, wrapper generation, analysis, hover computation
- hover-gradle/
  - Gradle plugin providing `generateHoverMaps` task

Output directory:
- website/static/hovermaps/<snippetId>.json

## JSON Schema (v1)
Each file:
- schemaVersion: 1
- snippetId: string
- codeHash: sha256(normalizedSnippet)
- language: "kotlin"
- code: normalized snippet code (markers removed, line count preserved)
- hovers: [
  - id: string
  - from: { line:int(1-based), col:int(1-based) }
  - to:   { line:int(1-based), col:int(1-based) }
  - title: string?
  - body:  string (markdown)
  - meta:
    - exprType: string?
    - declaredType: string?
    - receiverType: string?
    - reasonKind: "IS_CHECK" | "NEGATED_IS_CHECK_WITH_EXIT" | "WHEN_IS_BRANCH" | "EXPLICIT_CAST" | "UNKNOWN"
    - evidence: { from/to }?  (optional)
]

## Authoring Rules (markers)
Support markers in code:
- Inline: `/*hover:id=foo*/`
- Caret on next line: `// ^ hover:id=foo`

Mapping policy (must be deterministic):
- Inline marker attaches to the smallest meaningful PSI element adjacent to marker:
  1) token immediately preceding marker if it’s part of an expression
  2) else token immediately following marker
- Caret marker attaches to token at caret column on the previous non-empty line.

If multiple candidates exist, pick the smallest expression node (document exact logic).

## Extraction Inputs
Support both:
A) `docs/snippets/**/*.kt` (preferred, stable)
B) MDX fenced blocks with metadata ` ```kotlin id=... ` (optional, second pass)

Build a `SnippetSource` model:
- snippetId
- rawCode
- originPath + originLocation for error messages

## Normalization
- Remove marker comments but preserve line count and column alignment:
  - replace marker text with whitespace of equal length
- Emit `normalizedCode` plus a `LineMap` from snippet -> synthetic wrapper file.

## Synthetic Wrapper Strategy
Goal: create analyzable Kotlin file even for partial snippets.
- If snippet contains top-level `fun|class|object|interface|typealias|val|var` at column 0 -> treat as file-level.
- Else wrap in:
  ```kotlin
  package hovergen
  fun __snippet__() {
    // snippet lines
  }
