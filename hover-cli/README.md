# Komunasuarus Hover Maps Generator - Standalone CLI

A standalone command-line tool for generating hover maps from Kotlin code snippets. This tool extracts Kotlin snippets with hover markers and generates JSON hover maps with semantic type information using the Kotlin Analysis API.

## Features

- **Standalone execution** - No IntelliJ or Gradle required at runtime
- **Semantic analysis** - Uses Kotlin K2 Analysis API for type inference
- **Multiple sources** - Extract snippets from `.kt` files and MDX fenced code blocks
- **Deterministic output** - Consistent JSON output with code hashing
- **Fail-fast validation** - Catches errors early with clear messages

## Building

Build the standalone JAR:

```bash
./gradlew :hover-cli:jar
```

The JAR will be created at `hover-cli/build/libs/hover-cli.jar`

## Usage

### Using the convenience script (recommended)

The root `hover-cli.sh` script automatically builds if needed and runs the CLI:

```bash
./hover-cli.sh --snippets-dir ./docs/snippets --output-dir ./output
```

Force rebuild:
```bash
./hover-cli.sh --rebuild --snippets-dir ./docs/snippets --output-dir ./output
```

### Using java -jar directly

```bash
java -jar hover-cli/build/libs/hover-cli.jar --snippets-dir ./docs/snippets --output-dir ./output
```

### Using Gradle run task

```bash
./gradlew :hover-cli:run --args="--snippets-dir ./docs/snippets --output-dir ./output"
```

## Command-Line Options

### Required

- `-s, --snippets-dir <path>` - Directory containing Kotlin snippet files
- `-o, --output-dir <path>` - Directory to write hover map JSON files

### Optional

- `-d, --docs-dir <path>` - Directory to scan for MDX files (default: same as snippets-dir)
- `--no-mdx` - Don't extract snippets from MDX files
- `-k, --kotlin-version <ver>` - Kotlin version for validation (default: 2.3.0)
- `-cp, --classpath <paths>` - Colon-separated classpath for Analysis API
- `--jdk-home <path>` - JDK home directory for Analysis API
- `-v, --verbose` - Enable verbose error output
- `-h, --help` - Show help message

## Examples

### Basic usage

Extract snippets from a directory and generate hover maps:

```bash
./hover-cli.sh --snippets-dir ./docs/snippets --output-dir ./hovermaps
```

### With MDX extraction

Scan both `.kt` files in snippets directory and MDX files in docs:

```bash
./hover-cli.sh \
  --snippets-dir ./docs/snippets \
  --docs-dir ./docs \
  --output-dir ./website/static/hovermaps
```

### With custom classpath

Provide additional classpath for semantic analysis:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./lib/*:./build/classes/kotlin/main"
```

### Disable MDX scanning

Only process `.kt` files:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --no-mdx
```

### Verbose error output

Get full stack traces on errors:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --verbose
```

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

Add hover markers in fenced code blocks with `snippet:id` metadata:

````markdown
```kotlin snippet:id=example
val x = 42 /*hover:id=literal*/
```
````

## Output Format

For each snippet, generates a JSON file in the output directory:

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

### Inline markers

Place at the end of a token:

```kotlin
val x = 42 /*hover:id=my_marker*/
```

### Caret markers

Place on the line after, aligned with the start of the token:

```kotlin
println("Hello")
// ^ hover:id=my_marker
```

## Troubleshooting

### Build fails

Ensure you have JDK 21+ installed:

```bash
java -version
```

### No semantic info in output

Semantic analysis requires proper classpath configuration. Use `--classpath` to include dependencies:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./lib/*"
```

### Kotlin version mismatch

Ensure your snippets are compatible with Kotlin 2.3.0, or specify a different version:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --kotlin-version 2.3.0
```

## Development

### Project Structure

```
hover-cli/
├── src/main/kotlin/hovergen/cli/
│   └── HoverCli.kt           # Main CLI entry point
├── build.gradle.kts          # Build configuration
└── README.md                 # This file
```

### Dependencies

- `hover-engine` - Core hover map generation logic
- `hover-schema` - JSON schema and data models
- Kotlin stdlib

### Running tests

```bash
./gradlew :hover-cli:test
```

## Integration

The CLI can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Generate hover maps
  run: |
    ./hover-cli.sh \
      --snippets-dir ./docs/snippets \
      --output-dir ./website/static/hovermaps
```

## License

See root project LICENSE file.
