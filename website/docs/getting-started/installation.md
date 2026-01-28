---
sidebar_position: 1
---

# Installation

Kodeblok can be installed in several ways depending on your use case.

## CLI Installation

### Using the Install Script

The easiest way to install the Kodeblok CLI:

```bash
curl -fsSL https://raw.githubusercontent.com/amichne/kodeblok/main/install.sh | bash
```

### Building from Source

Clone the repository and build:

```bash
git clone https://github.com/amichne/kodeblok.git
cd kodeblok
./gradlew :kodeblok-cli:installDist
```

The CLI will be available at `kodeblok-cli/build/install/kodeblok-cli/bin/kodeblok-cli`.

## Gradle Plugin

Add to your `build.gradle.kts`:

```kotlin
plugins {
    id("dev.kodeblok.gradle") version "0.1.0"
}

kodeblok {
    // Configuration options
}
```

## Requirements

- JDK 17 or later
- Kotlin 2.0+ (for K2 Analysis API support)

## Verifying Installation

After installation, verify with:

```bash
kodeblok --version
```

You should see output like:

```
Kodeblok CLI v0.1.0
```
