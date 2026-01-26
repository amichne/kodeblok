#!/bin/bash

# Hover Maps Generator - Standalone CLI launcher
# This script builds and runs the kodeblok-cli tool

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

REBUILD=false
if [ "${1:-}" == "--rebuild" ]; then
    REBUILD=true
    shift
fi

resolve_java_bin() {
    if [ -n "${HOVER_CLI_JAVA:-}" ]; then
        echo "$HOVER_CLI_JAVA"
        return
    fi
    if [ -n "${HOVER_CLI_HOME:-}" ] && [ -x "$HOVER_CLI_HOME/jre/bin/java" ]; then
        echo "$HOVER_CLI_HOME/jre/bin/java"
        return
    fi
    if [ -n "${JAVA_HOME:-}" ] && [ -x "$JAVA_HOME/bin/java" ]; then
        echo "$JAVA_HOME/bin/java"
        return
    fi
    echo "java"
}

resolve_repo_jar() {
    ls -t "$SCRIPT_DIR"/kodeblok-cli/build/libs/kodeblok-cli-*.jar 2>/dev/null | head -n1 || true
}

resolve_jar_path() {
    if [ -n "${HOVER_CLI_JAR:-}" ]; then
        echo "$HOVER_CLI_JAR"
        return
    fi
    if [ -n "${HOVER_CLI_HOME:-}" ]; then
        echo "$HOVER_CLI_HOME/lib/kodeblok-cli.jar"
        return
    fi
    resolve_repo_jar
}

if [ -n "${HOVER_CLI_JAR:-}" ] || [ -n "${HOVER_CLI_HOME:-}" ]; then
    JAR_PATH="$(resolve_jar_path)"
else
    if $REBUILD || [ -z "$(resolve_repo_jar)" ]; then
        echo "Building kodeblok-cli..."
        ./gradlew :kodeblok-cli:jar
    fi
    JAR_PATH="$(resolve_repo_jar)"
fi

if [ -z "$JAR_PATH" ] || [ ! -f "$JAR_PATH" ]; then
    echo "Error: kodeblok-cli JAR not found." >&2
    echo "Set HOVER_CLI_JAR or HOVER_CLI_HOME, or run with --rebuild." >&2
    exit 1
fi

JAVA_BIN="$(resolve_java_bin)"
if [ "$JAVA_BIN" = "java" ] && ! command -v java >/dev/null 2>&1; then
    echo "Error: java not found on PATH." >&2
    echo "Set HOVER_CLI_JAVA or JAVA_HOME." >&2
    exit 1
fi

# Run the CLI
exec "$JAVA_BIN" -jar "$JAR_PATH" "$@"
