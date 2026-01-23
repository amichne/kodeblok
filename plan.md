# Plan: Kotlin Hover Maps Generator

## Goals (v1)
- CI-friendly Gradle task that generates hover maps for Kotlin snippets.
- Standalone K2 Analysis API (no IDE, no browser-side compilation).
- Deterministic ranges in snippet coordinates.
- Fail-fast on missing/ambiguous markers or analysis failures.

## Current implementation snapshot
- Modules
  - `hover-schema`: schema + JSON writer (`hovergen.schema.*`).
  - `hover-engine`: extraction, marker parsing, wrapping, token targeting, Analysis API bridge.
  - `hover-gradle`: Gradle plugin + `generateHoverMaps` task.
- Extraction
  - `docs/snippets/**/*.kt` supported.
  - MDX fenced blocks with ` ```kotlin id=... ` supported (optional).
- Marker handling
  - Inline `/*hover:id=...*/` and caret `// ^ hover:id=...` supported.
  - Markers removed by whitespace replacement to preserve line/col.
- Wrapping
  - File-level if top-level declaration at column 0.
  - Otherwise wrapped in `package hovergen` + `fun __snippet__()`.
- Output
  - `website/static/hovermaps/<snippetId>.json`.
- Analysis
  - Uses Standalone Analysis API.
  - Currently captures expression type + receiver type; reasonKind remains UNKNOWN.

## Decisions / pinned versions
- Kotlin generator version: `hover-engine/src/main/kotlin/hovergen/engine/EngineModels.kt` (`ENGINE_KOTLIN_VERSION`).
- Kotlin Gradle version: `gradle/libs.versions.toml`.
- Analysis API + IntelliJ platform: `hover-engine/build.gradle.kts` + `gradle.properties` (`analysisApiVersion`, `intellijSdk`).

## Remaining work to reach “functional”
1) Build + dependency wiring
- Expose `hover-schema` API from `hover-engine` (so plugin compile classpath sees `HoverMap`).
- Ensure `hover-gradle` compiles against Gradle + Kotlin Gradle plugin APIs.
- Ensure Analysis API runtime resolves required XML resources (enable transitive deps or add missing modules).

2) Analysis completeness (post-functional, but required for full spec)
- Provide `declaredType` and `reasonKind` (IS_CHECK / NEGATED / WHEN / EXPLICIT_CAST / UNKNOWN).
- Optionally map markers to smallest PSI expression instead of regex token targeting.

3) Validation
- `./gradlew build` (all modules + tests).
- `./gradlew :hover-engine:test` (analysis test + sample hover map test).
- Run `generateHoverMaps` in a consumer build or a local sample project.

## Acceptance criteria
- Sample snippet produces deterministic JSON with correct ranges.
- Gradle task runs in CI and fails fast on marker/analysis issues.
- Analysis API session resolves types for qualified expressions.
