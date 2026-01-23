#!/bin/bash

# Hover Maps Generator - Standalone CLI launcher
# This script builds and runs the hover-cli tool

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if we need to build
if [ ! -f "hover-cli/build/libs/hover-cli.jar" ] || [ "$1" == "--rebuild" ]; then
    echo "Building hover-cli..."
    ./gradlew :hover-cli:jar

    # Remove --rebuild flag from args if present
    if [ "$1" == "--rebuild" ]; then
        shift
    fi
fi

# Run the CLI
exec java -jar hover-cli/build/libs/hover-cli.jar "$@"
