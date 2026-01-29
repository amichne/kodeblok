---
sidebar_position: 2
---

# Usage

Learn how to use Kodeblok to analyze your Kotlin code.

## CLI Usage

### Basic Analysis

Analyze a Kotlin file and output insights to stdout:

```bash
kodeblok analyze path/to/file.kt
```

### Output to File

Save insights to a JSON file:

```bash
kodeblok analyze path/to/file.kt -o output.json
```

### Multiple Files

Analyze multiple files:

```bash
kodeblok analyze src/**/*.kt -o insights.json
```

## Output Format

Kodeblok outputs a `SemanticProfile` JSON object:

```json
{
  "snippetId": "my-snippet",
  "codeHash": "abc123...",
  "code": "fun main() { ... }",
  "insights": [
    {
      "id": "1",
      "position": {
        "from": { "line": 1, "col": 5 },
        "to": { "line": 1, "col": 12 }
      },
      "category": "TYPE_INFERENCE",
      "level": "HIGHLIGHTS",
      "kind": "INFERRED_TYPE",
      "tokenText": "numbers",
      "data": {
        "type": "TypeInference",
        "inferredType": "List<Int>"
      },
      "scopeChain": [...]
    }
  ],
  "rootScopes": [...]
}
```

## Using with the Playground

1. Generate insights with the CLI:
   ```bash
   kodeblok analyze myfile.kt -o myfile-insights.json
   ```

2. Open the [Playground](/playground)

3. Click "Upload JSON" and select your file

4. Explore the insights interactively!

## Insight Levels

Insights have different levels:

- **HIGHLIGHTS**: Important insights that are usually most relevant
- **ALL**: All detected insights, including verbose ones
- **OFF**: Disabled insights (not shown)

Use the filter in the playground to toggle between levels.

## Using Custom Imports (Project Code)

If your snippets import classes from the library you are documenting, make sure:

1) The snippet is treated as a file (include `package`/`import` lines).
2) The Analysis API classpath includes your library's compiled output.

### Example snippet with imports

`docs/snippets/user-service.kt`

```kotlin
package docs.snippets

import com.acme.user.User
import com.acme.user.UserService

fun demo(service: UserService, user: User) {
    val result = service.enrich(user)
    println(result)
}
```

Because this snippet contains `import` statements, Kodeblok treats it as a file-level snippet and analysis will resolve your custom types.

### Gradle plugin (recommended)

Add your library output + dependencies to the hover maps classpath:

```kotlin
tasks.named<kodeblok.gradle.GenerateHoverMapsTask>("generateHoverMaps") {
    analysisClasspath.from(sourceSets.main.get().output)
    analysisClasspath.from(configurations.compileClasspath)
}
```

Or configure via the `hoverMaps` extension:

```kotlin
hoverMaps {
    analysisClasspath.from(sourceSets.main.get().output)
    analysisClasspath.from(configurations.compileClasspath)
}
```

If your docs live in a separate Gradle project, add the library as a dependency and include it:

```kotlin
dependencies {
    hoverMapsDocs(project(":my-library"))
}

val hoverMapsDocs by configurations.creating

tasks.named<kodeblok.gradle.GenerateHoverMapsTask>("generateHoverMaps") {
    analysisClasspath.from(hoverMapsDocs)
}
```

### CLI workflow

When using the CLI, pass a classpath that includes your compiled library:

```bash
kodeblok-cli -s ./docs/snippets -o ./website/static/hovermaps \
  -cp "./build/classes/kotlin/main:./build/resources/main:./build/libs/*"
```
