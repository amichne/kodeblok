# Kodeblok

**Semantic Insight Generator for Kotlin Snippets**

![demo](gif #/static/demo.gif)

A tool for generating rich semantic analysis from Kotlin code snippets. Produces deterministic JSON output with type inference, nullability, smart casts, and more—designed for documentation sites to provide IDE-like hover tooltips without browser-side compilation.

## Features

- **Eager Semantic Analysis** - Automatically analyzes entire code blocks without requiring manual markers
- **K2 Analysis API** - Uses Kotlin's official Analysis API for accurate semantic information
- **7 Insight Categories** - TYPE_INFERENCE, NULLABILITY, SMART_CASTS, SCOPING, EXTENSIONS, LAMBDAS, OVERLOADS
- **Deterministic Output** - Consistent JSON with SHA-256 code hashing for caching
- **Multiple Input Sources** - Extract from `.kt` files and MDX fenced code blocks
- **Flexible Deployment** - Run as Gradle plugin or standalone CLI tool

## Quick Start

### Standalone CLI

Run as a standalone command-line tool without IntelliJ or IDE:

```bash
# Build the CLI
./gradlew :kodeblok-cli:jar

# Generate semantic profiles
./kodeblok \
  --snippets-dir ./docs/snippets \
  --output-dir ./website/static/hovermaps
```

For a portable install, build the macOS distribution:

```bash
./gradlew :kodeblok-cli:assembleMacosDistribution
export HOVER_CLI_HOME=/path/to/kodeblok-cli/build/dist/kodeblok-cli
kodeblok --snippets-dir ./docs/snippets --output-dir ./website/static/hovermaps
```

### Gradle Plugin

Apply the plugin in your `build.gradle.kts`:

```kotlin
plugins {
    id("com.komunasuarus.hovermaps")
}

hoverMaps {
    docsDir.set(file("docs"))
    snippetsDir.set(file("docs/snippets"))
    outputDir.set(file("website/static/hovermaps"))
    includeMdx.set(true)
}
```

Then run:

```bash
./gradlew generateHoverMaps
```

### Local Maven Integration (Development)

1. Publish the plugin from this repo:

```bash
./gradlew publishHoverGradlePluginToMavenLocal
```

2. In the consumer `settings.gradle.kts`:

```kotlin
pluginManagement {
    repositories {
        mavenLocal()
        maven("https://www.jetbrains.com/intellij-repository/releases")
        maven("https://packages.jetbrains.team/maven/p/ij/intellij-dependencies")
        maven("https://maven.pkg.jetbrains.space/kotlin/p/kotlin/dev")
        gradlePluginPortal()
        mavenCentral()
    }
}
```

3. In the consumer `gradle.properties` (required for Analysis API):

```properties
intellijHome=/Applications/IntelliJ IDEA.app
```

4. In the consumer `build.gradle.kts`:

```kotlin
plugins {
    kotlin("jvm") version "2.3.0"
    id("com.komunasuarus.hovermaps") version "1.0.0"
}

repositories {
    mavenLocal()
    mavenCentral()
    maven("https://www.jetbrains.com/intellij-repository/releases")
    maven("https://packages.jetbrains.team/maven/p/ij/intellij-dependencies")
    maven("https://maven.pkg.jetbrains.space/kotlin/p/kotlin/dev")
}

hoverMaps {
    docsDir.set(layout.projectDirectory.dir("docs"))
    snippetsDir.set(layout.projectDirectory.dir("docs/snippets"))
    outputDir.set(layout.projectDirectory.dir("build/hovermaps"))
    includeMdx.set(false)
}
```

## Project Structure

This is a multi-module Gradle project:

```
kodeblok/
├── kodeblok-schema/     # JSON schema and data models (SemanticProfile, InsightData)
├── kodeblok-engine/     # Core analysis: extraction, wrapping, semantic analysis
│   └── analysis/        # Analysis API integration and insight extractors
├── kodeblok-gradle/     # Gradle plugin providing generateHoverMaps task
├── kodeblok-cli/        # Standalone CLI tool (no IntelliJ required)
├── docs/snippets/       # Example Kotlin snippets
├── kodeblok             # CLI launcher script
└── kodeblok-cli.sh      # Development convenience script
```

## Input Format

### Kotlin Snippet Files

Create `.kt` files in your snippets directory:

```kotlin
// docs/snippets/example.kt
data class User(val name: String)

fun demo(repo: Repo, id: String) {
    val user = repo.findUser(id)
    if (user != null) {
        val upper = user.name.uppercase()
        println(upper)
    }
}

interface Repo { fun findUser(id: String): User? }
```

The analyzer automatically extracts insights for type inference, nullability checks, smart casts, and more.

### MDX Fenced Code Blocks

Embed snippets in documentation with `snippet:id` metadata:

````markdown
```kotlin snippet:id=example
val items = listOf("a", "b")
val mapped = items.map { it.uppercase() }
```
````

## Output Format

Generates `SemanticProfile` JSON files with rich insight data:

```json
{
  "snippetId": "example",
  "codeHash": "5f64d1240898f1bebcdf075040c61bb4df056f4bee3b54b375a90b9cd48bd87c",
  "code": "val user = repo.findUser(id)\n...",
  "insights": [
    {
      "id": "ins_001",
      "position": { "from": { "line": 3, "col": 7 }, "to": { "line": 3, "col": 11 } },
      "category": "NULLABILITY",
      "level": "HIGHLIGHTS",
      "kind": "NULLABLE_RETURN",
      "scopeChain": [
        { "scopeId": "scope_file", "kind": "FILE", "receiverType": null },
        { "scopeId": "scope_demo", "kind": "FUNCTION", "receiverType": null }
      ],
      "data": {
        "type": "Nullability",
        "inferredType": "User?",
        "why": "Function return type is nullable; downstream code must narrow."
      },
      "tokenText": "user"
    }
  ],
  "rootScopes": []
}
```

### Insight Categories

| Category | Description |
|----------|-------------|
| `TYPE_INFERENCE` | Inferred types, generic arguments |
| `NULLABILITY` | Nullable types, platform types, null-safe calls |
| `SMART_CASTS` | Automatic type narrowing after checks |
| `SCOPING` | Scope function context, receiver changes |
| `EXTENSIONS` | Extension function and property calls |
| `LAMBDAS` | Lambda parameter and return type inference |
| `OVERLOADS` | Function overload resolution |

## Requirements

- **JDK 21+** - Required for building and running
- **Kotlin 2.3.0** - Project Kotlin version
- **Gradle 8.14+** - For building (uses Gradle wrapper)

## Building

Build all modules:

```bash
./gradlew build
```

Build just the CLI:

```bash
./gradlew :kodeblok-cli:jar
```

Run tests:

```bash
./gradlew test
```

Run engine tests specifically:

```bash
./gradlew :kodeblok-engine:test
```

Run Gradle integration validation:

```bash
./gradlew validateHoverGradleIntegration
```

## Usage Examples

### Generate from Snippets Directory

```bash
./kodeblok \
  --snippets-dir ./docs/snippets \
  --output-dir ./hovermaps
```

### Include MDX Files

```bash
./kodeblok \
  --snippets-dir ./docs/snippets \
  --docs-dir ./docs \
  --output-dir ./website/static/hovermaps
```

### With Custom Classpath

```bash
./kodeblok \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./libs/*"
```

### CI Integration

```yaml
# .github/workflows/hovermaps.yml
- name: Generate semantic profiles
  run: |
    ./gradlew :kodeblok-cli:jar
    ./kodeblok \
      --snippets-dir ./docs/snippets \
      --output-dir ./website/static/hovermaps
```

## Key Components

- **KodeblokEngine** - Main orchestrator for semantic profile generation
- **SnippetExtractor** - Extracts snippets from `.kt` files and MDX blocks
- **SnippetNormalizer** - Removes markers while preserving line/column alignment
- **AnalysisApiEagerAnalyzer** - Eager semantic analysis using K2 Analysis API
- **Insight Extractors** - Per-category extractors (TypeInference, Nullability, SmartCast, etc.)
- **ScopeTreeBuilder** - Builds hierarchical scope trees
- **KodeblokMapWriter** - Writes JSON output

## Troubleshooting

**Build fails** - Ensure JDK 21+ is installed:
```bash
java -version
```

**No snippets found** - Check directory contains `.kt` files:
```bash
ls -la docs/snippets/
```

**Limited semantic info** - Provide classpath for better type inference:
```bash
./kodeblok \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./libs/*"
```

**Why the providers JAR is checked in** - The `libs/analysis-api-providers-for-ide-2.0.0-dev-8570.jar` is checked in because:
- `analysis-api-standalone-for-ide` doesn't ship providers
- `analysis-api-providers-for-ide` isn't published for 2.3.20-ij253-* in public repos
- Avoids requiring `intellijHome` for CLI usage in CI environments

## Design Philosophy

- **Deterministic** - Same input always produces same output (for caching)
- **Eager Analysis** - No manual markers required; analyzes entire code blocks
- **Fail-fast** - Validates early with clear error messages
- **Standalone** - No runtime IntelliJ dependency for CLI
- **Version-pinned** - Explicit Kotlin version (2.3.0) for consistency
- **CI-optimized** - Fast, cacheable, suitable for build pipelines
