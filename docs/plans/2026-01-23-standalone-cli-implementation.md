# Standalone CLI Distribution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a distributable macOS CLI package with bundled JRE that requires no external dependencies.

**Architecture:** Build a fat JAR containing all IntelliJ/Analysis API dependencies, bundle with a minimal JRE created via jlink, and package everything with a shell wrapper script in a tar.gz distribution.

**Tech Stack:** Gradle 8.14+, Kotlin 2.0+, jlink (JDK 21), Analysis API, IntelliJ Kotlin plugin JARs

---

## Task 1: Add Version Management

**Files:**
- Modify: `gradle.properties`
- Create: `hover-cli/src/main/kotlin/hovergen/cli/BuildConfig.kt` (generated)
- Modify: `hover-cli/build.gradle.kts`

**Step 1: Add version to gradle.properties**

Add to `gradle.properties`:
```properties
hover.cli.version=1.0.0
```

**Step 2: Create BuildConfig generation task**

Add to `hover-cli/build.gradle.kts` after the `dependencies` block:

```kotlin
val generateBuildConfig by tasks.registering {
    val version = project.findProperty("hover.cli.version") as String? ?: "dev"
    val outputDir = layout.buildDirectory.dir("generated/source/buildConfig")

    inputs.property("version", version)
    outputs.dir(outputDir)

    doLast {
        val file = outputDir.get().asFile.resolve("hovergen/cli/BuildConfig.kt")
        file.parentFile.mkdirs()
        file.writeText("""
            package hovergen.cli

            object BuildConfig {
                const val VERSION = "$version"
            }
        """.trimIndent())
    }
}

tasks.compileKotlin {
    dependsOn(generateBuildConfig)
}

sourceSets {
    main {
        kotlin.srcDir(layout.buildDirectory.dir("generated/source/buildConfig"))
    }
}
```

**Step 3: Verify BuildConfig is generated**

Run: `./gradlew :hover-cli:generateBuildConfig`
Expected: File created at `hover-cli/build/generated/source/buildConfig/hovergen/cli/BuildConfig.kt`

**Step 4: Test compilation with BuildConfig**

Run: `./gradlew :hover-cli:compileKotlin --no-daemon`
Expected: SUCCESS (compilation should work with generated BuildConfig)

**Step 5: Commit**

```bash
git add gradle.properties hover-cli/build.gradle.kts
git commit -m "feat: add version management and BuildConfig generation

- Add hover.cli.version property
- Generate BuildConfig.kt with version constant
- Wire up to compileKotlin task

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Enhance Fat JAR with All Dependencies

**Files:**
- Modify: `hover-cli/build.gradle.kts`

**Step 1: Add reference to hover-engine's Analysis API resources**

Modify the `dependencies` block in `hover-cli/build.gradle.kts`:

```kotlin
dependencies {
    implementation(project(":hover-engine"))
    implementation(project(":hover-schema"))
    implementation("org.jetbrains.kotlin:kotlin-stdlib")

    // Explicitly include hover-engine's runtime dependencies for fat JAR
    runtimeOnly(project(":hover-engine", configuration = "runtimeClasspath"))
}
```

**Step 2: Enhance jar task to include Analysis API resources**

Replace the existing `tasks.jar` block with:

```kotlin
tasks.jar {
    manifest {
        attributes["Main-Class"] = "hovergen.cli.HoverCliKt"
    }

    // Create a fat JAR with all dependencies
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE

    from(configurations.runtimeClasspath.get().map {
        if (it.isDirectory) it else zipTree(it)
    })

    // Explicitly merge META-INF/services files (for ServiceLoader)
    from(configurations.runtimeClasspath.get().map {
        if (!it.isDirectory) {
            zipTree(it).matching {
                include("META-INF/services/**")
            }
        } else {
            files()
        }
    }) {
        into("META-INF/services")
        duplicatesStrategy = DuplicatesStrategy.INCLUDE
    }

    archiveBaseName.set("hover-cli")
    archiveVersion.set(project.findProperty("hover.cli.version") as String? ?: "dev")
}
```

**Step 3: Build the fat JAR**

Run: `./gradlew :hover-cli:jar --no-daemon`
Expected: JAR created at `hover-cli/build/libs/hover-cli-1.0.0.jar`

**Step 4: Verify JAR size and contents**

Run: `ls -lh hover-cli/build/libs/hover-cli-1.0.0.jar && unzip -l hover-cli/build/libs/hover-cli-1.0.0.jar | grep "META-INF/analysis-api" | head -5`
Expected: JAR size >100MB, META-INF/analysis-api files present

**Step 5: Test fat JAR runs with system Java**

Run: `java -jar hover-cli/build/libs/hover-cli-1.0.0.jar --help 2>&1 || echo "Exit code: $?"`
Expected: Help output or reasonable error (not ClassNotFoundException)

**Step 6: Commit**

```bash
git add hover-cli/build.gradle.kts
git commit -m "feat: enhance fat JAR with all Analysis API dependencies

- Include hover-engine runtimeClasspath
- Merge META-INF/services for ServiceLoader
- Set version-based JAR name
- Preserve Analysis API resources

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Minimal JRE with jlink

**Files:**
- Modify: `hover-cli/build.gradle.kts`

**Step 1: Add jlink task**

Add after the `tasks.jar` block in `hover-cli/build.gradle.kts`:

```kotlin
val createJre by tasks.registering(Exec::class) {
    description = "Creates a minimal JRE for macOS using jlink"
    group = "distribution"

    val jreOutputDir = layout.buildDirectory.dir("jre-macos")

    inputs.property("javaHome", System.getProperty("java.home"))
    outputs.dir(jreOutputDir)

    doFirst {
        delete(jreOutputDir)
    }

    commandLine(
        "${System.getProperty("java.home")}/bin/jlink",
        "--add-modules", "java.base,java.logging,java.xml,java.desktop,jdk.compiler,jdk.unsupported,jdk.zipfs",
        "--output", jreOutputDir.get().asFile.absolutePath,
        "--compress", "2",
        "--no-header-files",
        "--no-man-pages",
        "--strip-debug"
    )
}
```

**Step 2: Run jlink to create JRE**

Run: `./gradlew :hover-cli:createJre --no-daemon`
Expected: JRE created at `hover-cli/build/jre-macos/`

**Step 3: Verify JRE structure and size**

Run: `ls -lh hover-cli/build/jre-macos/ && du -sh hover-cli/build/jre-macos/`
Expected: Directories: bin/, lib/, conf/ - Size: ~50-80MB

**Step 4: Test bundled JRE runs Java**

Run: `hover-cli/build/jre-macos/bin/java -version`
Expected: Java version 21.x output

**Step 5: Test bundled JRE runs the fat JAR**

Run: `hover-cli/build/jre-macos/bin/java -jar hover-cli/build/libs/hover-cli-1.0.0.jar --help 2>&1 || echo "Exit: $?"`
Expected: Help output or reasonable error (verifying JRE has required modules)

**Step 6: Commit**

```bash
git add hover-cli/build.gradle.kts
git commit -m "feat: add jlink task for minimal JRE creation

- Create ~50-80MB JRE with required modules
- Include Analysis API modules (jdk.compiler, jdk.unsupported)
- Compress and strip debug symbols
- Test JRE can run fat JAR

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Shell Wrapper Script

**Files:**
- Create: `hover-cli/src/dist/bin/hover-cli.template`
- Modify: `hover-cli/build.gradle.kts`

**Step 1: Create shell script template**

Create `hover-cli/src/dist/bin/hover-cli.template`:

```bash
#!/bin/sh
# Hover CLI wrapper script
# Auto-generated - do not edit manually

# Resolve script directory (handles symlinks)
SCRIPT="$0"
while [ -h "$SCRIPT" ]; do
    LS=$(ls -ld "$SCRIPT")
    LINK=$(expr "$LS" : '.*-> \(.*\)$')
    if expr "$LINK" : '/.*' > /dev/null; then
        SCRIPT="$LINK"
    else
        SCRIPT=$(dirname "$SCRIPT")/"$LINK"
    fi
done
SCRIPT_DIR=$(cd "$(dirname "$SCRIPT")" && pwd)

# Paths to bundled JRE and JAR
JAVA_BIN="$SCRIPT_DIR/../jre/bin/java"
JAR_PATH="$SCRIPT_DIR/../lib/hover-cli.jar"

# Validation
if [ ! -x "$JAVA_BIN" ]; then
    echo "Error: Bundled JRE not found at $JAVA_BIN" >&2
    echo "Please ensure the distribution is complete and unmodified." >&2
    exit 1
fi

if [ ! -f "$JAR_PATH" ]; then
    echo "Error: hover-cli.jar not found at $JAR_PATH" >&2
    echo "Please ensure the distribution is complete and unmodified." >&2
    exit 1
fi

# Execute JAR with bundled JRE
exec "$JAVA_BIN" -jar "$JAR_PATH" "$@"
```

**Step 2: Make template executable (for git)**

Run: `chmod +x hover-cli/src/dist/bin/hover-cli.template`
Expected: File is now executable

**Step 3: Add task to process template**

Add after `createJre` task in `hover-cli/build.gradle.kts`:

```kotlin
val processShellScript by tasks.registering {
    description = "Processes shell script template"
    group = "distribution"

    val templateFile = file("src/dist/bin/hover-cli.template")
    val outputFile = layout.buildDirectory.file("scripts/hover-cli")

    inputs.file(templateFile)
    outputs.file(outputFile)

    doLast {
        outputFile.get().asFile.parentFile.mkdirs()
        templateFile.copyTo(outputFile.get().asFile, overwrite = true)
        outputFile.get().asFile.setExecutable(true)
    }
}
```

**Step 4: Test script processing**

Run: `./gradlew :hover-cli:processShellScript --no-daemon`
Expected: Script created at `hover-cli/build/scripts/hover-cli`

**Step 5: Verify script is executable**

Run: `ls -l hover-cli/build/scripts/hover-cli && head -5 hover-cli/build/scripts/hover-cli`
Expected: Executable permissions, shebang line visible

**Step 6: Commit**

```bash
git add hover-cli/src/dist/bin/hover-cli.template hover-cli/build.gradle.kts
git commit -m "feat: add shell wrapper script template

- POSIX sh compatible wrapper
- Resolves script location (handles symlinks)
- Validates JRE and JAR exist
- Clear error messages for missing components

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Assemble macOS Distribution

**Files:**
- Modify: `hover-cli/build.gradle.kts`

**Step 1: Add distribution assembly task**

Add after `processShellScript` task:

```kotlin
val assembleMacosDistribution by tasks.registering(Copy::class) {
    description = "Assembles the complete macOS distribution"
    group = "distribution"

    dependsOn(tasks.jar, createJre, processShellScript)

    val distDir = layout.buildDirectory.dir("dist/hover-cli")

    into(distDir)

    // Copy shell wrapper to bin/
    from(processShellScript) {
        into("bin")
    }

    // Copy fat JAR to lib/
    from(tasks.jar) {
        into("lib")
        rename { "hover-cli.jar" }
    }

    // Copy JRE to jre/
    from(createJre) {
        into("jre")
    }

    doLast {
        val binDir = distDir.get().asFile.resolve("bin")
        binDir.listFiles()?.forEach { it.setExecutable(true) }
    }
}
```

**Step 2: Run distribution assembly**

Run: `./gradlew :hover-cli:assembleMacosDistribution --no-daemon`
Expected: Distribution created at `hover-cli/build/dist/hover-cli/`

**Step 3: Verify distribution structure**

Run: `ls -lR hover-cli/build/dist/hover-cli/ | head -30`
Expected: Directories: bin/, lib/, jre/ with expected files

**Step 4: Test distribution end-to-end**

Run: `hover-cli/build/dist/hover-cli/bin/hover-cli --help 2>&1 || echo "Exit: $?"`
Expected: Help output showing CLI usage

**Step 5: Verify executable works from different directory**

Run: `(cd /tmp && /Users/amichne/code/komunasuarus/.worktrees/standalone-cli-distribution/hover-cli/build/dist/hover-cli/bin/hover-cli --help) 2>&1 | head -5`
Expected: Help output (proves relative paths work)

**Step 6: Commit**

```bash
git add hover-cli/build.gradle.kts
git commit -m "feat: add macOS distribution assembly task

- Copies fat JAR to lib/
- Copies bundled JRE to jre/
- Copies shell wrapper to bin/
- Sets executable permissions
- Creates complete self-contained distribution

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Distribution Tarball

**Files:**
- Modify: `hover-cli/build.gradle.kts`

**Step 1: Add tarball creation task**

Add after `assembleMacosDistribution` task:

```kotlin
val createMacosTarball by tasks.registering(Tar::class) {
    description = "Creates a .tar.gz distribution for macOS"
    group = "distribution"

    dependsOn(assembleMacosDistribution)

    val version = project.findProperty("hover.cli.version") as String? ?: "dev"
    archiveBaseName.set("hover-cli-macos")
    archiveVersion.set(version)
    compression = Compression.GZIP
    archiveExtension.set("tar.gz")

    from(layout.buildDirectory.dir("dist"))

    destinationDirectory.set(layout.buildDirectory.dir("distributions"))
}
```

**Step 2: Build the tarball**

Run: `./gradlew :hover-cli:createMacosTarball --no-daemon`
Expected: Tarball created at `hover-cli/build/distributions/hover-cli-macos-1.0.0.tar.gz`

**Step 3: Verify tarball size**

Run: `ls -lh hover-cli/build/distributions/hover-cli-macos-1.0.0.tar.gz`
Expected: Size ~150-230MB (compressed)

**Step 4: Test tarball extraction**

Run: `mkdir -p /tmp/hover-test && cd /tmp/hover-test && tar -xzf /Users/amichne/code/komunasuarus/.worktrees/standalone-cli-distribution/hover-cli/build/distributions/hover-cli-macos-1.0.0.tar.gz && ls -la`
Expected: `hover-cli/` directory extracted

**Step 5: Test extracted distribution works**

Run: `/tmp/hover-test/hover-cli/bin/hover-cli --help 2>&1 | head -5`
Expected: Help output

**Step 6: Clean up test extraction**

Run: `rm -rf /tmp/hover-test`

**Step 7: Commit**

```bash
git add hover-cli/build.gradle.kts
git commit -m "feat: add tarball creation for distribution

- Creates hover-cli-macos-<version>.tar.gz
- Compresses complete distribution
- Ready for distribution to users
- Tested extraction and execution

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add --version Flag to CLI

**Files:**
- Modify: `hover-cli/src/main/kotlin/hovergen/cli/HoverCli.kt`

**Step 1: Read current CLI implementation**

Read: `hover-cli/src/main/kotlin/hovergen/cli/HoverCli.kt`
Expected: Understand current argument parsing

**Step 2: Add version check at start of main**

Add at the beginning of the `main` function in `HoverCli.kt`:

```kotlin
fun main(args: Array<String>) {
    // Handle --version flag
    if (args.contains("--version")) {
        println("Komunasuarus Hover CLI version ${BuildConfig.VERSION}")
        exitProcess(0)
    }

    // ... existing code ...
}
```

**Step 3: Add missing import**

Add import at top of file:
```kotlin
import kotlin.system.exitProcess
```

**Step 4: Build and test version flag**

Run: `./gradlew :hover-cli:jar --no-daemon && java -jar hover-cli/build/libs/hover-cli-1.0.0.jar --version`
Expected: Output: `Komunasuarus Hover CLI version 1.0.0`

**Step 5: Test in distribution**

Run: `./gradlew :hover-cli:createMacosTarball && cd /tmp && rm -rf hover-test && mkdir hover-test && cd hover-test && tar -xzf /Users/amichne/code/komunasuarus/.worktrees/standalone-cli-distribution/hover-cli/build/distributions/hover-cli-macos-1.0.0.tar.gz && hover-cli/bin/hover-cli --version`
Expected: `Komunasuarus Hover CLI version 1.0.0`

**Step 6: Commit**

```bash
git add hover-cli/src/main/kotlin/hovergen/cli/HoverCli.kt
git commit -m "feat: add --version flag to CLI

- Shows version from BuildConfig
- Exits cleanly after displaying version
- Works in standalone distribution

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Distribution Validation Task

**Files:**
- Modify: `hover-cli/build.gradle.kts`

**Step 1: Add validation task**

Add after `createMacosTarball` task:

```kotlin
val validateDistribution by tasks.registering(Exec::class) {
    description = "Validates the macOS distribution works correctly"
    group = "verification"

    dependsOn(createMacosTarball)

    val testDir = layout.buildDirectory.dir("validation-test")
    val tarball = createMacosTarball.get().archiveFile.get().asFile

    doFirst {
        delete(testDir)
        testDir.get().asFile.mkdirs()
    }

    workingDir = testDir.get().asFile

    commandLine(
        "sh", "-c",
        """
        set -e
        tar -xzf ${tarball.absolutePath}
        ./hover-cli/bin/hover-cli --version
        test -x ./hover-cli/bin/hover-cli
        test -f ./hover-cli/lib/hover-cli.jar
        test -d ./hover-cli/jre/bin
        test -x ./hover-cli/jre/bin/java
        echo "✓ Distribution validation passed"
        """
    )

    doLast {
        delete(testDir)
    }
}
```

**Step 2: Run validation**

Run: `./gradlew :hover-cli:validateDistribution --no-daemon`
Expected: Output: `✓ Distribution validation passed`

**Step 3: Test validation catches missing files**

Manually test: Rename a file in the distribution and verify validation fails
Expected: Validation detects missing files

**Step 4: Commit**

```bash
git add hover-cli/build.gradle.kts
git commit -m "feat: add distribution validation task

- Extracts tarball to temp directory
- Verifies all components exist
- Tests --version flag works
- Checks executable permissions
- Auto-cleans up test directory

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Add Build Documentation

**Files:**
- Create: `hover-cli/README.md`

**Step 1: Create README**

Create `hover-cli/README.md`:

```markdown
# Hover CLI - Standalone Distribution

Standalone CLI tool for generating Kotlin hover maps with bundled JRE.

## Building the Distribution

### Prerequisites

- macOS (for creating macOS JRE)
- JDK 21+ installed
- IntelliJ IDEA installed
- Gradle property in `gradle.properties`: `intellijHome=/path/to/IntelliJ IDEA.app`

### Build Commands

Build the complete distribution:
```bash
./gradlew :hover-cli:createMacosTarball
```

Output: `hover-cli/build/distributions/hover-cli-macos-<version>.tar.gz`

Validate the distribution:
```bash
./gradlew :hover-cli:validateDistribution
```

### Distribution Contents

```
hover-cli/
├── bin/
│   └── hover-cli          # Shell wrapper script
├── lib/
│   └── hover-cli.jar      # Fat JAR (~100-150MB)
└── jre/                   # Bundled JRE (~50-80MB)
    ├── bin/
    ├── lib/
    └── conf/
```

## Using the Distribution

### Installation

1. Extract the tarball:
   ```bash
   tar -xzf hover-cli-macos-1.0.0.tar.gz
   ```

2. Add to PATH:
   ```bash
   export PATH="$PWD/hover-cli/bin:$PATH"
   ```

3. Run:
   ```bash
   hover-cli --version
   hover-cli --snippets-dir ./snippets --output-dir ./output
   ```

### Requirements

- macOS (no JDK required - uses bundled JRE)
- No IntelliJ IDEA required

## Development

### Version Management

Version is set in `gradle.properties`:
```properties
hover.cli.version=1.0.0
```

### Build Tasks

- `generateBuildConfig` - Generates BuildConfig.kt with version
- `jar` - Creates fat JAR with all dependencies
- `createJre` - Creates minimal JRE using jlink
- `processShellScript` - Processes shell wrapper template
- `assembleMacosDistribution` - Assembles complete distribution
- `createMacosTarball` - Creates distributable .tar.gz
- `validateDistribution` - Tests the distribution works

### Architecture

The distribution includes:

1. **Fat JAR** - All dependencies bundled:
   - hover-engine + hover-schema
   - Analysis API standalone JARs
   - IntelliJ Kotlin plugin JARs
   - META-INF/analysis-api resources

2. **Minimal JRE** - Created with jlink:
   - Modules: java.base, java.logging, java.xml, java.desktop, jdk.compiler, jdk.unsupported, jdk.zipfs
   - Size: ~50-80MB (vs 300MB+ full JDK)

3. **Shell Wrapper** - POSIX sh script:
   - Resolves its own location
   - Points to bundled JRE
   - Validates components exist
   - Executes JAR with bundled JRE

## Troubleshooting

### Build Failures

Ensure `intellijHome` is set correctly:
```bash
ls "$intellijHome/Contents/plugins/Kotlin/lib/"
```

Should show Kotlin plugin JARs.

### Distribution Doesn't Run

Verify extraction:
```bash
ls -la hover-cli/
```

Should show bin/, lib/, jre/ directories.

Check permissions:
```bash
ls -l hover-cli/bin/hover-cli
```

Should be executable (-rwxr-xr-x).

### Size Concerns

Total distribution: ~150-230MB compressed

This is expected due to:
- IntelliJ Kotlin plugin JARs (~80MB)
- kotlin-compiler (~50MB)
- Analysis API (~30MB)
- Bundled JRE (~50MB)

Size is acceptable for a developer tool with full semantic analysis capabilities.
```

**Step 2: Commit documentation**

```bash
git add hover-cli/README.md
git commit -m "docs: add build and usage documentation for CLI

- Build prerequisites and commands
- Distribution contents and structure
- Installation and usage instructions
- Development guide with build tasks
- Architecture overview
- Troubleshooting guide

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Update Root Documentation

**Files:**
- Modify: `README.md` (root)

**Step 1: Read current README**

Read: `README.md`
Expected: Understand current structure

**Step 2: Add distribution section**

Add a new section to the root `README.md` before the existing content:

```markdown
## Standalone CLI Distribution

The `hover-cli` module can be built as a standalone distribution with bundled JRE.

**Quick Start:**

```bash
# Build distribution
./gradlew :hover-cli:createMacosTarball

# Extract and use
tar -xzf hover-cli/build/distributions/hover-cli-macos-1.0.0.tar.gz
hover-cli/bin/hover-cli --version
```

See [hover-cli/README.md](hover-cli/README.md) for detailed build and usage instructions.

**Distribution includes:**
- Self-contained JAR with all dependencies
- Bundled minimal JRE (~50-80MB)
- No external JDK or IntelliJ IDEA required
- Total size: ~150-230MB compressed

---

```

**Step 3: Commit root README update**

```bash
git add README.md
git commit -m "docs: add standalone CLI distribution to root README

- Link to hover-cli README
- Quick start instructions
- Distribution highlights

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

After completing all tasks:

- [ ] Version management in place (gradle.properties, BuildConfig)
- [ ] Fat JAR includes all Analysis API dependencies
- [ ] Minimal JRE created with jlink (~50-80MB)
- [ ] Shell wrapper script with error handling
- [ ] Complete distribution assembled (bin/, lib/, jre/)
- [ ] Tarball created (~150-230MB compressed)
- [ ] --version flag works
- [ ] Validation task passes
- [ ] Documentation complete (build + usage)
- [ ] Distribution runs on macOS without JDK
- [ ] Distribution runs without IntelliJ IDEA

## Testing Checklist

Manual verification after implementation:

1. **Build test:**
   ```bash
   ./gradlew :hover-cli:createMacosTarball
   ```

2. **Extraction test:**
   ```bash
   cd /tmp && tar -xzf <path>/hover-cli-macos-1.0.0.tar.gz
   ```

3. **Version test:**
   ```bash
   /tmp/hover-cli/bin/hover-cli --version
   ```

4. **Functionality test:**
   ```bash
   /tmp/hover-cli/bin/hover-cli --snippets-dir <test-dir> --output-dir /tmp/output
   ```

5. **No JDK test:**
   ```bash
   unset JAVA_HOME
   /tmp/hover-cli/bin/hover-cli --version
   ```

All tests should pass without requiring system JDK or IntelliJ IDEA.
