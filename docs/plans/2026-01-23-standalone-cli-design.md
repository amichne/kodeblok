# Standalone CLI Distribution Design

**Date:** 2026-01-23
**Status:** Approved
**Platform:** macOS (initial target)

## Problem Statement

The current hover-cli requires the entire repository structure and an IntelliJ IDEA installation to run. This makes it non-distributable to end users. We need a standalone CLI that bundles all dependencies and can run with only a bundled JRE.

## Goals

1. Create a distributable hover-cli that requires no external dependencies
2. No global JDK requirement - bundle a minimal JRE
3. Self-contained distribution that works on clean macOS machines
4. Maintain full Analysis API semantic analysis capabilities
5. Keep distribution size reasonable (<250MB)

## Non-Goals

- Native compilation with GraalVM (Analysis API incompatibility)
- Linux/Windows support in initial release (future expansion)
- GUI application bundle (CLI tool only)
- System-wide installation via .pkg installer (user-local install only)

## Distribution Structure

```
hover-cli-macos-<version>.tar.gz
└── hover-cli/
    ├── bin/
    │   └── hover-cli          # Shell script wrapper
    ├── lib/
    │   └── hover-cli.jar      # Fat JAR with all dependencies
    └── jre/                   # Bundled minimal JRE (jlink output)
        ├── bin/
        ├── lib/
        └── ...
```

### User Workflow

1. **Download and extract:**
   ```bash
   tar -xzf hover-cli-macos-1.0.0.tar.gz
   ```

2. **Add to PATH:**
   ```bash
   export PATH="$PWD/hover-cli/bin:$PATH"
   ```

3. **Run:**
   ```bash
   hover-cli --snippets-dir ./snippets --output-dir ./output
   ```

### Shell Wrapper Script

The `bin/hover-cli` script will:
- Resolve its own location using `$0` and `dirname`
- Point to bundled JRE: `SCRIPT_DIR/../jre/bin/java`
- Execute: `"$JAVA" -jar "$SCRIPT_DIR/../lib/hover-cli.jar" "$@"`
- Use POSIX sh syntax (no bash-isms) for maximum portability
- Include basic error checking (JRE exists, JAR exists)

## Build Architecture

### Gradle Task Flow

```
hover-cli/build.gradle.kts:
  1. shadowJar (or enhanced jar task)
     → Creates fat JAR with all dependencies
     → Includes Analysis API resources
     → Includes all IntelliJ Kotlin plugin JARs

  2. createJre (jlink task)
     → Creates minimal JRE for macOS
     → Includes required Java modules

  3. assembleMacosDistribution
     → Creates directory structure
     → Copies fat JAR to lib/
     → Copies JRE to jre/
     → Generates shell wrapper script
     → Makes script executable

  4. createMacosTarball
     → Packages everything as .tar.gz
```

### Fat JAR Construction

**Dependencies to bundle:**
- hover-engine (project dependency)
- hover-schema (project dependency)
- kotlin-stdlib
- kotlin-compiler
- Analysis API standalone JARs (non-transitive)
- Analysis API resources (extracted from kotlin-plugin.jar)
- All Kotlin plugin lib JARs (from intellijHome)
- Runtime dependencies (caffeine, kotlinx-serialization)

**Key considerations:**
- Use `duplicatesStrategy = DuplicatesStrategy.EXCLUDE` to handle conflicts
- Preserve META-INF/analysis-api/** resources
- Set Main-Class manifest: `hovergen.cli.HoverCliKt`
- Ensure all service provider files are merged (META-INF/services/*)

### JRE Creation with jlink

**Required Java modules:**
```
java.base           # Core Java classes
java.logging        # Logging framework
java.xml            # XML processing
java.desktop        # AWT/Swing (IntelliJ platform deps)
jdk.compiler        # Compiler API (Analysis API)
jdk.unsupported     # sun.misc.Unsafe (used by IntelliJ)
```

**Additional modules to test:**
- `jdk.jdi` - Java Debug Interface (might be needed)
- `jdk.zipfs` - ZIP filesystem provider (for JAR access)

**jlink command structure:**
```bash
jlink \
  --add-modules <module-list> \
  --output build/jre-macos \
  --compress=2 \
  --no-header-files \
  --no-man-pages \
  --strip-debug
```

Expected JRE size: 50-80MB

## Handling IntelliJ/Analysis API Dependencies

### Current State (Build-time)

The hover-engine currently requires:
- `intellijHome` Gradle property pointing to IntelliJ IDEA installation
- Kotlin plugin JARs at `$intellijHome/Contents/plugins/Kotlin/lib/*.jar`
- Analysis API resources extracted from `kotlin-plugin.jar`

### New State (Runtime)

The standalone distribution will:
- Embed all IntelliJ dependencies in the fat JAR at build time
- Remove runtime dependency on IntelliJ installation
- Users do not need IntelliJ IDEA installed

### Build Machine Requirements

To build the standalone CLI, developers need:
- macOS (for creating macOS-compatible JRE)
- JDK 21+ installed
- IntelliJ IDEA installed locally
- Gradle property: `intellijHome=/Applications/IntelliJ IDEA.app`

The build extracts dependencies from IntelliJ once, bundles them, and creates a self-contained distribution.

## Versioning and Distribution

### Version Management

- Store version in `gradle.properties`: `hover.cli.version=1.0.0`
- Or derive from git tags: `git describe --tags --always`
- Include in tarball filename: `hover-cli-macos-1.0.0.tar.gz`

### CLI Version Flag

Add `--version` flag to HoverCli.kt:
```kotlin
when {
    args.contains("--version") -> {
        println("Komunasuarus Hover CLI version ${BuildConfig.VERSION}")
        exitProcess(0)
    }
}
```

Generate `BuildConfig.kt` at build time with version constant.

## Testing and Validation

### Build-time Validation

1. **Fat JAR completeness check:**
   - Verify Analysis API classes are present
   - Check for required META-INF resources
   - Validate manifest Main-Class

2. **JRE validation:**
   - Verify jlink succeeded
   - Check all required modules are included
   - Test JRE can execute simple Java programs

3. **Distribution structure check:**
   - Verify all expected files exist
   - Check shell script has executable permission
   - Validate relative paths in wrapper script

### Runtime Validation

**Shell wrapper error handling:**
```bash
if [ ! -d "$SCRIPT_DIR/../jre" ]; then
    echo "Error: Bundled JRE not found" >&2
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/../lib/hover-cli.jar" ]; then
    echo "Error: hover-cli.jar not found" >&2
    exit 1
fi
```

**CLI startup validation:**
- Check Java version is 21+ (runtime version check)
- Validate Analysis API classes are loadable
- Show clear error messages for common failures

### Integration Testing

Create Gradle task `testDistribution`:
1. Extract tarball to temporary directory
2. Run hover-cli with test snippets
3. Verify hover maps are generated correctly
4. Clean up temporary files

### Manual Testing Checklist

Test on clean macOS machine:
- [ ] No IntelliJ IDEA installed
- [ ] No JAVA_HOME set
- [ ] Extract to /tmp and run
- [ ] Extract to ~/Downloads and run
- [ ] Extract to /Applications and run
- [ ] Verify hover maps generated correctly
- [ ] Test all CLI flags work
- [ ] Test error handling (invalid paths, missing args)

## Size Estimates

| Component | Estimated Size |
|-----------|---------------|
| Fat JAR (with Analysis API) | 100-150 MB |
| Minimal JRE (jlink) | 50-80 MB |
| **Total (compressed .tar.gz)** | **~150-230 MB** |

The large size is due to:
- IntelliJ Kotlin plugin JARs (~80MB)
- kotlin-compiler (~50MB)
- Analysis API standalone (~30MB)
- Bundled JRE (~50MB)

This is acceptable for a developer tool with full semantic analysis capabilities.


### CI/CD Pipeline

Use GitHub Actions matrix builds:
```yaml
strategy:
  matrix:
    os: [macos-latest, ubuntu-latest, windows-latest]
```

Each runner:
1. Checks out repository
2. Builds fat JAR (same for all platforms)
3. Runs jlink for platform-specific JRE
4. Creates platform-specific distribution
5. Uploads artifact

## Implementation Plan

1. **Phase 1: Fat JAR** (hover-cli/build.gradle.kts)
   - Add Shadow plugin or enhance jar task
   - Bundle all Analysis API dependencies
   - Test JAR runs with system Java

2. **Phase 2: JRE Bundling**
   - Add jlink task to create minimal JRE
   - Determine required modules through testing
   - Optimize JRE size

3. **Phase 3: Distribution Assembly**
   - Create directory structure task
   - Generate shell wrapper script
   - Package as .tar.gz

4. **Phase 4: Testing**
   - Add integration test task
   - Validate on clean macOS machine
   - Document build and usage

5. **Phase 5: Versioning**
   - Add version to gradle.properties
   - Generate BuildConfig.kt
   - Add --version flag to CLI

## Success Criteria

- [ ] Single .tar.gz file downloads and extracts
- [ ] Runs on macOS without JDK installed
- [ ] Runs on macOS without IntelliJ IDEA installed
- [ ] Generates correct hover maps with full semantic analysis
- [ ] Distribution size under 250MB compressed
- [ ] Clear error messages for common issues
- [ ] Works when extracted to any directory
- [ ] Build process documented and repeatable
