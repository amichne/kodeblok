# Komunasuarus

**Hover Maps Generator for Kotlin Snippets**

A tool for generating deterministic hover maps from Kotlin code snippets with semantic type information. Designed for documentation sites to provide IDE-like hover tooltips without browser-side compilation.

## Features

- **K2 Analysis API** - Uses Kotlin's official Analysis API for semantic type information
- **Deterministic Output** - Consistent JSON output with code hashing for caching
- **Multiple Input Sources** - Extract from `.kt` files and MDX fenced code blocks
- **Flexible Deployment** - Run as Gradle plugin or standalone CLI tool
- **CI-Friendly** - Fast, fail-fast validation with clear error messages

## Quick Start

### Standalone CLI (Recommended)

Run as a standalone command-line tool without IntelliJ or IDE:

```bash
# Build the CLI
./gradlew :hover-cli:jar

# Generate hover maps
./hover \
  --snippets-dir ./docs/snippets \
  --output-dir ./website/static/hovermaps
```

For a portable install, build the distribution and set `HOVER_CLI_HOME`:

```bash
./gradlew :hover-cli:assembleMacosDistribution
export HOVER_CLI_HOME=/path/to/hover-cli/build/dist/hover-cli
hover --snippets-dir ./docs/snippets --output-dir ./website/static/hovermaps
```

**See [CLI-USAGE.md](./CLI-USAGE.md) for complete examples and integration guides.**

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

### Golden Path: Local Maven Integration (Development)

Use this when you want to test the Gradle plugin from a separate project using Maven Local.

1) Publish the plugin from this repo:

```bash
./gradlew publishHoverGradlePluginToMavenLocal
```

2) In the consumer `settings.gradle.kts`:

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

3) In the consumer `gradle.properties` (required for Analysis API):

```properties
intellijHome=/Applications/IntelliJ IDEA.app
```

4) In the consumer `build.gradle.kts`:

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

5) Add a snippet file and generate output:

```kotlin
// docs/snippets/example.kt
val name = "Kotlin"
val greeting = "Hi, " + name /*hover:id=greeting_name*/
println(greeting)
// ^ hover:id=call_println
```

```bash
./gradlew generateHoverMaps
```

Result: `build/hovermaps/example.json`.

## Project Structure

This is a multi-module Gradle project:

- **hover-schema** - JSON schema and data models for hover map output
- **hover-engine** - Core extraction, parsing, wrapping, and semantic analysis
- **hover-gradle** - Gradle plugin providing `generateHoverMaps` task
- **hover-cli** - Standalone CLI tool (no IntelliJ/IDE required)

## Input Format

### Kotlin Snippet Files

Create `.kt` files with hover markers:

```kotlin
// docs/snippets/example.kt
val name = "Kotlin"
val greeting = "Hi, " + name /*hover:id=greeting_name*/
println(greeting)
// ^ hover:id=call_println
```

### MDX Fenced Code Blocks

Embed snippets in documentation with `snippet:id` metadata:

````markdown
```kotlin snippet:id=example
val x = 42 /*hover:id=literal*/
```
````

## Output Format

Generates JSON hover maps:

```json
{
  "schemaVersion": 1,
  "snippetId": "example",
  "codeHash": "5f64d1240898f1bebcdf075040c61bb4df056f4bee3b54b375a90b9cd48bd87c",
  "language": "kotlin",
  "code": "val name = \"Kotlin\"\n...",
  "hovers": [
    {
      "id": "greeting_name",
      "from": {"line": 2, "col": 25},
      "to": {"line": 2, "col": 28},
      "body": "Symbol: `name`\n\n_No semantic info available._"
    }
  ]
}
```

## Marker Syntax

**Inline markers** - Place at end of token:
```kotlin
val x = 42 /*hover:id=my_marker*/
```

**Caret markers** - Place on line after, aligned with token start:
```kotlin
println("Hello")
// ^ hover:id=my_marker
```

## Requirements

- **JDK 21+** - Required for building and running
- **Kotlin 2.3.0** - Project Kotlin version
- **Gradle 8.14+** - For building (uses Gradle wrapper)

## Documentation

- **[CLI-USAGE.md](./CLI-USAGE.md)** - Complete CLI usage guide with examples
- **[hover-cli/README.md](./hover-cli/README.md)** - CLI tool documentation
- **hover-engine/** - Core engine implementation
- **hover-schema/** - JSON schema definitions

## Building

Build all modules:

```bash
./gradlew build
```

Build just the CLI:

```bash
./gradlew :hover-cli:jar
```

Run tests:

```bash
./gradlew test
```

## Usage Examples

### Example 1: Generate from Snippets Directory

```bash
./hover \
  --snippets-dir ./docs/snippets \
  --output-dir ./hovermaps
```

### Example 2: Include MDX Files

```bash
./hover \
  --snippets-dir ./docs/snippets \
  --docs-dir ./docs \
  --output-dir ./website/static/hovermaps
```

### Example 3: CI Integration

```yaml
# .github/workflows/hovermaps.yml
- name: Generate hover maps
  run: |
    ./gradlew :hover-cli:jar
    ./hover \
      --snippets-dir ./docs/snippets \
      --output-dir ./website/static/hovermaps
```

See [CLI-USAGE.md](./CLI-USAGE.md) for more examples.

## Development

### Module Structure

```
komunasuarus/
├── hover-schema/          # Data models and JSON serialization
├── hover-engine/          # Core analysis and extraction logic
├── hover-gradle/          # Gradle plugin
├── hover-cli/             # Standalone CLI tool
├── docs/snippets/         # Example Kotlin snippets
├── hover                 # Short CLI launcher
├── hover-cli.sh           # CLI convenience launcher
└── CLI-USAGE.md          # Complete usage guide
```

### Key Components

- **HoverEngine** (`hover-engine/src/main/kotlin/hovergen/engine/HoverEngine.kt`) - Main orchestrator
- **SemanticAnalyzer** - Interface for semantic analysis (K2 Analysis API implementation)
- **MarkerParser** - Parses inline and caret hover markers
- **TokenLocator** - Maps markers to actual code tokens
- **HoverMapWriter** - Writes JSON output

### Testing

Run engine tests:

```bash
./gradlew :hover-engine:test
```

Run the golden-path Gradle integration check:

```bash
./gradlew validateHoverGradleIntegration
```

Test with example snippet:

```bash
./hover \
  --snippets-dir ./docs/snippets \
  --output-dir ./test-output \
  --verbose
```

## Troubleshooting

**Build fails** - Ensure JDK 21+ is installed:
```bash
java -version
```

**No snippets found** - Check directory contains `.kt` files:
```bash
ls -la docs/snippets/
```

**No semantic info** - Provide classpath for better type inference:
```bash
./hover \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./libs/*"
```

**Why the providers JAR is checked in** - We evaluated removing `libs/analysis-api-providers-for-ide-2.0.0-dev-8570.jar`, but:
- `analysis-api-standalone-for-ide` does not ship providers, so it cannot replace the jar by itself.
- `analysis-api-providers-for-ide` is published in the Kotlin dev repo only at `2.0.0-dev-8570`, which would force downgrading the rest of the Analysis API stack.
- `analysis-api-providers-for-ide` is not published for `2.3.20-ij253-*` in `intellij-dependencies`, so we cannot align versions there.
- Pulling providers from IntelliJ Kotlin plugin libs adds a hard runtime dependency on `intellijHome` for all environments (including CI), which we avoid for the CLI.

## Design Philosophy

- **Deterministic** - Same input always produces same output (for caching)
- **Fail-fast** - Validates early with clear error messages
- **Standalone** - No runtime IntelliJ dependency for CLI
- **Version-pinned** - Explicit Kotlin version (2.3.0) for consistency
- **CI-optimized** - Fast, cacheable, suitable for build pipelines

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

## Links

- **Documentation**: See `CLI-USAGE.md` and module READMEs
- **Issues**: [Add issue tracker URL]
- **Analysis API**: [Kotlin Analysis API Docs](https://github.com/JetBrains/kotlin/tree/master/analysis)
