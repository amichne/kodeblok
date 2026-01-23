## Implementation plan: Kotlin hover-maps generator using K2 + Analysis API (Standalone)

This plan assumes you want a **Gradle plugin/task** that runs in CI, analyzes Kotlin snippets via **K2 Analysis API**, and emits your **hover JSON** for Docusaurus. It also assumes you’ll use the **Standalone Analysis API platform** (not IntelliJ). This platform exists and is used by tools like KSP, but it is explicitly an evolving surface with maintenance risk.  [oai_citation:0‡GitHub](https://github.com/detekt/detekt/issues/8021?utm_source=chatgpt.com)
Also note: the Analysis API is still in flux (including symbol renames like `KtAnalysisSession` → `KaSession`). Plan to pin Kotlin versions and maintain a thin compatibility layer.  [oai_citation:1‡googlesamples.github.io](https://googlesamples.github.io/android-custom-lint-rules/api-guide.html?utm_source=chatgpt.com)

---

# 0) Non-negotiable design choices

### Version pinning + compatibility layer
- Pin Kotlin (e.g., `2.3.x`) for the generator.
- Wrap Analysis API usage behind your own interfaces (e.g., `SemanticAnalyzer`), because public names and package layouts have changed.  [oai_citation:2‡googlesamples.github.io](https://googlesamples.github.io/android-custom-lint-rules/api-guide.html?utm_source=chatgpt.com)

### Deterministic mapping
- Never compute offsets directly on the MDX string.
- Always compile/analyze a **synthetic `.kt` file** generated from the snippet and keep a stable **line map** from snippet → synthetic file.

### Fail-fast CI
- If any hover marker is missing, ambiguous, or maps to a PSI element without semantic info, fail the task.
- CI should be the enforcement mechanism, not runtime heuristics.

---

# 1) Repository structure (recommended)

### Modules
1. `:hover-schema`
    - JSON model classes (Kotlin data classes) + schema versioning
    - JSON serialization (kotlinx.serialization)

2. `:hover-engine`
    - Extraction + marker parsing + synthetic file generation
    - Analysis API integration (Standalone)
    - Hover computation (types, receiver, smart-cast narrative)
    - Outputs `HoverMap` objects

3. `:hover-gradle`
    - Gradle plugin: adds a task `generateHoverMaps`
    - Inputs: docs directory, classpath resolution, optional snippet include/exclude rules
    - Outputs: `website/static/hovermaps/*.json`

---

# 2) Authoring conventions (what your docs writers do)

### A) Stable snippet identity
Every snippet must have:
- `snippetId` (string) stable over time
- Kotlin code content

Options:
- Put snippet sources in `docs/snippets/*.kt` and reference them from MDX
- Or embed in MDX fenced blocks with an info string carrying `id=...`

### B) Stable hover targets (markers)
Use explicit markers that can be located without guesswork:

**Inline marker**
```kotlin
return x /*hover:id=smartcast_x*/.takeIf { it.isNotBlank() }
```

Rules:
- Marker attaches to the *nearest expression token before/after*, based on a deterministic policy you define once.
- Marker must resolve to exactly one PSI element range.

---

# 3) Extraction pipeline

### Inputs
- `docs/**.mdx` and/or `docs/snippets/**.kt`
- Project classpath (depends on what you want to resolve)

### Steps
1. Parse sources and extract Kotlin snippets with:
    - `snippetId`
    - `rawCode`
    - `origin` (file path + location for error reporting)

2. Parse `rawCode` to find markers:
    - `hover:id=...`
    - record *marker position* in snippet coordinates (line/col or offset)

3. Produce `normalizedCode`:
    - remove marker comments **without changing line count** (replace with whitespace)
    - preserve indentation/formatting to keep line mapping stable

4. Produce a `SyntheticKtFile` per snippet:
    - add `package` and optional imports
    - wrap snippet in a container if needed (see next section)
    - maintain a `LineMap`:
        - snippet line → synthetic file line

---

# 4) Synthetic file strategy (critical for K2 semantic quality)

Your snippets are often not full compilation units. You need a predictable wrapper.

### Common wrappers
1. **File-level declarations already valid**: keep as-is
2. **Expression-only snippet**: wrap in a function
   ```kotlin
   package hovergen
   fun __snippet__() {
     // snippet lines
   }
   ```
3. **Class member snippet**: wrap in a class + function
4. **Requires types from your library**: add imports and ensure classpath includes your project output jars

This is where you decide “enterprise-grade” constraints:
- either (A) require snippets compile/typecheck against the project (best),
- or (B) allow “doc-only stubs” (fast but less truthful).

---

# 5) Standalone Analysis API setup (K2)

### Why standalone
You want CI + no IDE. The detekt community discussion is aligned: standalone AA is the route for CLI environments (but it’s evolving).  [oai_citation:3‡GitHub](https://github.com/detekt/detekt/issues/8021?utm_source=chatgpt.com)

### Setup tasks
- Create a Standalone Analysis API project/environment with:
    - source roots = generated `.kt` files
    - classpath = dependencies + compiled outputs of your project (at least `compileClasspath`)
    - language version settings pinned to your Kotlin version (K2 compiler is your base)  [oai_citation:4‡Kotlin](https://kotlinlang.org/docs/k2-compiler-migration-guide.html?utm_source=chatgpt.com)

**Implementation note:** Standalone AA APIs and entry points have been moving; keep this code isolated in `:hover-engine:analysis/` and version-gated.  [oai_citation:5‡googlesamples.github.io](https://googlesamples.github.io/android-custom-lint-rules/api-guide.html?utm_source=chatgpt.com)

---

# 6) Hover computation (types, receiver, smart-cast narrative)

For each marker target element (a PSI element you identify from the marker position):

## A) Identify the semantic target
- Find PSI leaf at marker offset
- Walk up to the “smallest meaningful expression”:
    - `KtNameReferenceExpression`
    - `KtDotQualifiedExpression`
    - `KtCallExpression`
    - `KtQualifiedExpression`
- Persist:
    - source range (line/col) in snippet coordinates (via the `LineMap`)

## B) Expression type
Within a `KaSession`/analysis scope (name varies by Kotlin version):
- get the expression’s `KaType`
- render it to a stable string:
    - fully qualified or simplified consistently (your choice, but be consistent)

## C) Receiver type (if applicable)
If the target is a qualified call (`x.length`, `foo.bar()`):
- compute receiver expression type (`x` in `x.length`)
- include:
    - receiver type string
    - resolved symbol for member (optional)

## D) Smart-cast reasoning
K2 improves smart-cast behavior in more scenarios, so your tooling should be K2-based.  [oai_citation:6‡Kotlin](https://kotlinlang.org/docs/k2-compiler-migration-guide.html?utm_source=chatgpt.com)

Produce reasoning using a layered strategy:

1) **Declared type** (pre-cast)
- For a name reference `x`, resolve symbol → declared type

2) **Type in current flow**
- Ask Analysis API for the expression type at this location; if it differs from declared, it’s a cast/smart-cast candidate.

3) **Reason explanation heuristics** (deterministic)
- Walk up PSI parents to find dominating constructs:
    - `if (x is T)` then-branch
    - `if (x !is T) return` fallthrough smart-cast
    - `when (x) { is T -> ... }`
    - `x as T`
- Emit a short structured reason:
    - `kind`: `IS_CHECK` | `NEGATED_IS_CHECK_WITH_EXIT` | `EXPLICIT_CAST` | `WHEN_IS_BRANCH` | `UNKNOWN`
    - `evidenceRange`: the range of the dominating check (optional)
    - `message`: human readable

This yields an “IDE-like” explanation even if the Analysis API doesn’t hand you a perfect “because …” string.

---

# 7) Output JSON (versioned, stable)

Emit one file per snippet:
- `website/static/hovermaps/<snippetId>.json`

Include:
- `schemaVersion`
- `snippetId`
- `codeHash` (sha256 of normalized snippet) for cache invalidation
- `hovers[]` with:
    - `id`
    - `from/to` (line/col)
    - `title`
    - `body` (markdown array or a single markdown string)
    - optionally `meta` (receiverType, exprType, declaredType, reasonKind)

---

# 8) Gradle plugin/task design

### Task: `generateHoverMaps`
Inputs:
- `docsDir`
- `snippetsDir` (optional)
- `classpath` (resolved from a target source set, e.g. `main`)
- `kotlinVersion` (must match project)
- toggles: `failOnWarning`, `emitDebugArtifacts`

Outputs:
- JSON files under `website/static/hovermaps`

Incrementality:
- key by `codeHash` + generator version + Kotlin version

Integration:
- Make `buildWebsite` depend on `generateHoverMaps`
- CI runs: `./gradlew generateHoverMaps buildWebsite`

---

# 9) Docusaurus wiring

- Your `AnnotatedCode` component can accept either:
    - `annotations=[...]` inline, or
    - `hoverMapId="..."` that loads `/hovermaps/<id>.json`

Runtime behavior:
- No compilation/execution.
- Pure client rendering of ranges + tooltips.

---

# 10) Acceptance criteria (what “done” means)

1. A Kotlin snippet with `hover:id=...` produces a JSON hover entry with:
    - correct range
    - correct expression type
2. Qualified call entries include receiver type
3. At least these smart-cast patterns emit a non-`UNKNOWN` reason:
    - `if (x is T) { x.<hover> }`
    - `if (x !is T) return; x.<hover>`
    - `when (x) { is T -> x.<hover> }`
4. CI fails on:
    - missing hover targets
    - ambiguous mapping
    - semantic resolution failure
5. Works in a multi-module build where snippets reference your library types (classpath correctness).

---

## Notes on risk/maintenance (pragmatic)
- Standalone Analysis API is powerful but not “set in stone”; treat it like a compiler-internals-adjacent dependency even if it’s presented as an API. The detekt migration discussion captures the reality for CLI users.  [oai_citation:7‡GitHub](https://github.com/detekt/detekt/issues/8021?utm_source=chatgpt.com)
- The API has experienced broad renames (e.g., `KtAnalysisSession` → `KaSession`). Put all Analysis API calls behind 1–2 files and pin Kotlin.  [oai_citation:8‡googlesamples.github.io](https://googlesamples.github.io/android-custom-lint-rules/api-guide.html?utm_source=chatgpt.com)
