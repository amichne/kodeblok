# Komunasuarus - Standalone CLI Usage Guide

This guide shows how to use Komunasuarus as a standalone command-line tool, independent of IntelliJ or any IDE.

## Quick Start

### 1. Build the CLI Tool

```bash
./gradlew :hover-cli:jar
```

This creates a standalone JAR at `hover-cli/build/libs/hover-cli.jar`

### 2. Run Using the Convenience Script

The easiest way to use the CLI:

```bash
./hover-cli.sh --snippets-dir ./docs/snippets --output-dir ./output
```

### 3. Or Run Directly with Java

```bash
java -jar hover-cli/build/libs/hover-cli.jar \
  --snippets-dir ./docs/snippets \
  --output-dir ./output
```

## Complete Examples

### Example 1: Basic Usage

Generate hover maps from Kotlin snippet files:

```bash
# Create a snippets directory
mkdir -p my-snippets

# Create a sample snippet
cat > my-snippets/example.kt << 'EOF'
val name = "Kotlin"
val greeting = "Hi, " + name /*hover:id=concat*/
println(greeting)
// ^ hover:id=print_call
EOF

# Generate hover maps
./hover-cli.sh \
  --snippets-dir ./my-snippets \
  --output-dir ./hovermaps

# View the output
cat hovermaps/example.json
```

Expected output structure:
```json
{
  "schemaVersion": 1,
  "snippetId": "example",
  "codeHash": "...",
  "language": "kotlin",
  "code": "val name = \"Kotlin\"\nval greeting = \"Hi, \" + name                 \nprintln(greeting)\n                     \n\n",
  "hovers": [
    {
      "id": "concat",
      "from": {"line": 2, "col": 25},
      "to": {"line": 2, "col": 28},
      "body": "Symbol: `name`\n\n_No semantic info available._"
    },
    {
      "id": "print_call",
      "from": {"line": 3, "col": 1},
      "to": {"line": 3, "col": 7},
      "body": "Symbol: `println`\n\n_No semantic info available._"
    }
  ]
}
```

### Example 2: With MDX Documentation

Extract snippets from both `.kt` files and MDX documentation:

```bash
# Setup directories
mkdir -p docs/snippets
mkdir -p docs/guides

# Create a Kotlin snippet
cat > docs/snippets/basics.kt << 'EOF'
val x = 42 /*hover:id=int_literal*/
val doubled = x * 2 /*hover:id=multiply*/
EOF

# Create an MDX file with embedded snippet
cat > docs/guides/tutorial.mdx << 'EOF'
# Tutorial

Here's an example:

```kotlin snippet:id=inline-example
val message = "Hello" /*hover:id=string_literal*/
println(message)
// ^ hover:id=print_fn
```
EOF

# Generate hover maps from both sources
./hover-cli.sh \
  --snippets-dir ./docs/snippets \
  --docs-dir ./docs \
  --output-dir ./website/static/hovermaps

# Check outputs
ls -la website/static/hovermaps/
# Output: basics.json, inline-example.json
```

### Example 3: With Custom Classpath for Better Type Inference

Provide additional classpath for semantic analysis:

```bash
# Assume you have some Kotlin library dependencies
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "/path/to/your/libs/*:/path/to/compiled/classes" \
  --verbose
```

### Example 4: Skip MDX Scanning (Kotlin Files Only)

Process only `.kt` files, ignore MDX:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --no-mdx
```

### Example 5: Custom Kotlin Version Validation

Specify a different Kotlin version for validation:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --kotlin-version 2.2.0
```

## CLI Options Reference

```
Required:
  -s, --snippets-dir <path>     Directory with .kt snippet files
  -o, --output-dir <path>       Where to write JSON hover maps

Optional:
  -d, --docs-dir <path>         Directory to scan for MDX (default: same as snippets-dir)
  --no-mdx                      Skip MDX extraction
  -k, --kotlin-version <ver>    Kotlin version (default: 2.3.0)
  -cp, --classpath <paths>      Colon-separated classpath
  --jdk-home <path>             JDK home for Analysis API
  -v, --verbose                 Verbose error output
  -h, --help                    Show help
```

## Marker Syntax

### Inline Markers

Place `/*hover:id=name*/` at the end of the token you want to annotate:

```kotlin
val result = 42 /*hover:id=the_answer*/
val sum = 1 + 2 /*hover:id=addition*/
```

### Caret Markers

Place `// ^ hover:id=name` on the line after, aligned with token start:

```kotlin
println("Hello, World!")
// ^ hover:id=print_function

someObject.method()
      // ^ hover:id=method_call
```

### Rules

1. Each marker must have a unique `id` within the snippet
2. Markers are replaced with whitespace in output (preserving positions)
3. Markers must point to valid Kotlin tokens
4. Use inline markers for expressions, caret markers for calls/references

## Integration Examples

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Generate Hover Maps

on:
  push:
    paths:
      - 'docs/snippets/**'
      - 'docs/**/*.mdx'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Build hover-cli
        run: ./gradlew :hover-cli:jar

      - name: Generate hover maps
        run: |
          ./hover-cli.sh \
            --snippets-dir ./docs/snippets \
            --docs-dir ./docs \
            --output-dir ./website/static/hovermaps

      - name: Commit generated maps
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add website/static/hovermaps/
          git commit -m "Update hover maps" || echo "No changes"
          git push
```

### NPM Script Integration

Add to your `package.json`:

```json
{
  "scripts": {
    "hovermaps": "cd ../komunasuarus && ./hover-cli.sh --snippets-dir ../my-docs/snippets --output-dir ../my-docs/static/hovermaps",
    "docs:build": "npm run hovermaps && docusaurus build"
  }
}
```

### Makefile Integration

```makefile
.PHONY: hovermaps
hovermaps:
	./hover-cli.sh \
		--snippets-dir ./docs/snippets \
		--docs-dir ./docs \
		--output-dir ./website/static/hovermaps

.PHONY: docs
docs: hovermaps
	cd website && npm run build
```

## Troubleshooting

### "Snippets directory does not exist"

Ensure the path is correct and the directory exists:

```bash
mkdir -p ./docs/snippets
ls -la ./docs/snippets
```

### "No snippets found"

Check that your directory contains `.kt` files or MDX files with `snippet:id=...`:

```bash
find ./docs/snippets -name "*.kt"
```

### Build fails with "JDK not found"

Ensure JDK 21 is installed:

```bash
java -version
# Should show version 21 or higher
```

### "Kotlin version mismatch"

The tool uses Kotlin 2.3.0. If your snippets use different language features:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --kotlin-version 2.3.0
```

### No semantic type information in output

To get better type inference, provide classpath with your dependencies:

```bash
./hover-cli.sh \
  --snippets-dir ./snippets \
  --output-dir ./maps \
  --classpath "./build/libs/*:./dependencies/*"
```

## Performance Tips

1. **Use `--no-mdx`** if you don't have MDX files - faster scanning
2. **Smaller snippets** - Keep snippets focused for faster analysis
3. **Cache builds** - The JAR only needs rebuilding when updating the tool
4. **Parallel CI** - Generate hover maps in parallel with other build steps

## Distribution

To distribute the CLI tool to users:

### Option 1: Share the JAR

```bash
# Build
./gradlew :hover-cli:jar

# Share the JAR
cp hover-cli/build/libs/hover-cli.jar /path/to/distribution/

# Users run:
java -jar hover-cli.jar --snippets-dir ./snippets --output-dir ./maps
```

### Option 2: Create an executable archive

```bash
# Build and package
./gradlew :hover-cli:jar
mkdir -p dist
cp hover-cli/build/libs/hover-cli.jar dist/
cp hover-cli.sh dist/

# Create archive
tar -czf komunasuarus-cli.tar.gz dist/

# Users extract and run:
# tar -xzf komunasuarus-cli.tar.gz
# cd dist
# ./hover-cli.sh --help
```

### Option 3: System-wide installation

```bash
# Build
./gradlew :hover-cli:jar

# Install (Linux/Mac)
sudo mkdir -p /usr/local/lib/komunasuarus
sudo cp hover-cli/build/libs/hover-cli.jar /usr/local/lib/komunasuarus/
sudo cat > /usr/local/bin/komunasuarus << 'EOF'
#!/bin/bash
exec java -jar /usr/local/lib/komunasuarus/hover-cli.jar "$@"
EOF
sudo chmod +x /usr/local/bin/komunasuarus

# Users run:
komunasuarus --snippets-dir ./snippets --output-dir ./maps
```

## Next Steps

- See `hover-cli/README.md` for detailed CLI documentation
- Check `docs/snippets/` for example snippets
- Read the hover-schema module for JSON output format details
- Explore the hover-engine module for the analysis implementation

## Support

For issues and feature requests, visit:
https://github.com/[your-repo]/komunasuarus/issues
