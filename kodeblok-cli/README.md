**Standalone CLI for Kotlin Semantic Analysis**

A command-line tool for generating semantic profiles from Kotlin code snippets. Extracts Kotlin snippets and produces JSON output with type inference, nullability, smart casts, and more using the Kotlin K2 Analysis API.

## Features

- **Standalone execution** - No IntelliJ or Gradle required at runtime
- **Eager semantic analysis** - Automatically analyzes entire code blocks
- **K2 Analysis API** - Uses Kotlin's official Analysis API for accurate type information
- **Multiple sources** - Extract snippets from `.kt` files and MDX fenced code blocks
- **Deterministic output** - Consistent JSON with SHA-256 code hashing

## Building

Build the standalone JAR:

```bash
./gradlew :kodeblok-cli:jar
```

The JAR is created at `kodeblok-cli/build/libs/kodeblok-cli-<version>.jar`

Build a portable distribution with bundled JRE (macOS):

```bash
./gradlew :kodeblok-cli:assembleMacosDistribution
```

The distribution is created at `kodeblok-cli/build/dist/kodeblok-cli`.

## Usage

### Using the `kodeblok` launcher (recommended)

The `kodeblok` launcher script at the repo root handles JAR and Java resolution:

```bash
export HOVER_CLI_HOME=/path/to/kodeblok-cli
kodeblock --snippets-dir ./docs/snippets --output-dir ./output
```

For portable installations, set `HOVER_CLI_HOME`:

```bash
export HOVER_CLI_JAR=/path/to/kodeblok-cli.jar
export HOVER_CLI_JAVA=/path/to/java
kodeblock --snippets-dir ./docs/snippets --output-dir ./output
```

`HOVER_CLI_HOME` should point to the distribution root containing `bin/`, `lib/`, and `jre/`.

### Using the development script

The `kodeblok-cli.sh` script automatically builds if needed:

```bash
./kodeblok-cli.sh --snippets-dir ./docs/snippets --output-dir ./output
```

### Using java -jar directly

```bash
java -jar kodeblok-cli/build/libs/kodeblok-cli-*.jar \
  --snippets-dir ./docs/snippets \
  --output-dir ./output
```

### Using Gradle run task

```bash
./gradlew :kodeblok-cli:run --args="--snippets-dir ./docs/snippets --output-dir ./output"
```

## Command-Line Options

### Required

| Option | Description |
|--------|-------------|
| `-s, --snippets-dir <path>` | Directory containing Kotlin snippet files |
| `-o, --output-dir <path>` | Directory to write kodeblock JSON files |

### Optional

| Option | Description |
|--------|-------------|
| `-d, --docs-dir <path>` | Directory to scan for MDX files (default: same as snippets-dir) |
| `--no-mdx` | Don't extract snippets from MDX files |
| `-k, --kotlin-version <ver>` | Kotlin version for validation (default: 2.3.0) |
| `-cp, --classpath <paths>` | Classpath for Analysis API (use OS path separator) |
| `--jdk-home <path>` | JDK home directory for Analysis API |
| `-v, --verbose` | Enable verbose error output |
| `--version` | Show version information |
| `-h, --help` | Show help message |

### Environment Variables

These provide defaults that CLI options override:

| Variable | Description |
|----------|-------------|
| `HOVER_SNIPPETS_DIR` | Same as `--snippets-dir` |
| `HOVER_DOCS_DIR` | Same as `--docs-dir` |
| `HOVER_OUTPUT_DIR` | Same as `--output-dir` |
| `HOVER_INCLUDE_MDX` | `true`/`false` (default: true) |
| `HOVER_KOTLIN_VERSION` | Same as `--kotlin-version` |
| `HOVER_CLASSPATH` | Classpath (use OS path separator) |
| `HOVER_JDK_HOME` | Same as `--jdk-home` |
| `HOVER_VERBOSE` | `true`/`false` (default: false) |

## Examples

### Basic usage

Extract snippets from a directory and generate kodeblock maps:

```bash
kodeblock --snippets-dir ./docs/snippets --output-dir ./hovermaps
```

### With MDX extraction

Scan both `.kt` files in snippets directory and MDX files in docs:

```bash
kodeblock \
  --snippets-dir ./docs/snippets \
  --docs-dir ./docs \
  --output-dir ./website/static/hovermaps
```

### With custom classpath

Provide additional classpath for better semantic analysis:

```bash
kodeblock \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./lib/*:./build/classes/kotlin/main"
```

### Disable MDX scanning

Only process `.kt` files:

```bash
kodeblock \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --no-mdx
```

### Verbose error output

Get full stack traces on errors:

```bash
kodeblock \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --verbose
```

## Input Format

### Kotlin Snippet Files

Create `.kt` files with kodeblock markers:

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

The analyzer automatically extracts insights without requiring manual markers.

### MDX Fenced Code Blocks

Add kodeblock markers in fenced code blocks with `snippet:id` metadata:
Add `snippet:id` metadata to fenced code blocks:

````markdown
```kotlin snippet:id=example
val items = listOf("a", "b")
val mapped = items.map { it.uppercase() }
```
````

## Output Format

For each snippet, generates a `SemanticProfile` JSON file:

```json
{
  "snippetId": "example",
  "codeHash": "5f64d1240898f1bebcdf075040c61bb4df056f4bee3b54b375a90b9cd48bd87c",
  "code": "data class User(val name: String)\n...",
  "insights": [
    {
      "id": "ins_001",
      "position": { "from": { "line": 4, "col": 7 }, "to": { "line": 4, "col": 11 } },
      "category": "NULLABILITY",
      "level": "HIGHLIGHTS",
      "kind": "NULLABLE_RETURN",
      "scopeChain": [...],
      "data": {
        "type": "Nullability",
        "inferredType": "User?",
        "why": "Function return type is nullable."
      },
      "tokenText": "user"
    }
  ],
  "rootScopes": []
}
```

### Insight Categories

- `TYPE_INFERENCE` - Inferred types, generic arguments
- `NULLABILITY` - Nullable types, platform types, null-safe calls
- `SMART_CASTS` - Automatic type narrowing after checks
- `SCOPING` - Scope function context, receiver changes
- `EXTENSIONS` - Extension function and property calls
- `LAMBDAS` - Lambda parameter and return type inference
- `OVERLOADS` - Function overload resolution

## Project Structure

```
kodeblok-cli/
├── src/main/kotlin/kodeblok/cli/
│   └── KodeblokCli.kt        # Main CLI entry point
├── src/dist/bin/
│   └── kodeblok-cli.template # Shell wrapper template
├── build.gradle.kts          # Build configuration
└── README.md                 # This file
```

## Dependencies

- `kodeblok-engine` - Core semantic analysis engine
- `kodeblok-schema` - JSON schema and data models
- Kotlin stdlib

## CI Integration

```yaml
# GitHub Actions example
- name: Generate semantic profiles
  run: |
    ./gradlew :kodeblok-cli:jar
    ./kodeblok \
      --snippets-dir ./docs/snippets \
      --output-dir ./website/static/hovermaps
```

## Troubleshooting

### Build fails

Ensure JDK 21+ is installed:

```bash
java -version
```

### Limited semantic info

Provide classpath for better type inference:

```bash
kodeblock \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./lib/*"
```

### Kotlin version mismatch

Ensure snippets are compatible with Kotlin 2.3.0, or specify a different version:

```bash
kodeblock \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --kotlin-version 2.3.0
```

## Development

### Project Structure

```
kodeblok-cli/
├── src/main/kotlin/kodeblok/cli/
│   └── KodeblokCli.kt           # Main CLI entry point
├── build.gradle.kts          # Build configuration
└── README.md                 # This file
```

### Dependencies

- `kodeblock-engine` - Core kodeblock map generation logic
- `kodeblock-schema` - JSON schema and data models
- Kotlin stdlib

### Running tests

```bash
./gradlew :kodeblok-cli:test
```

## Integration

The CLI can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Generate kodeblock maps
  run: |
    kodeblock \
      --snippets-dir ./docs/snippets \
      --output-dir ./website/static/hovermaps
```

## License

See root project LICENSE file.
