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
