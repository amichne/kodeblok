#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PREFIX="${PREFIX:-$HOME/.local}"
INSTALL_DIR=""
BIN_DIR=""
FORCE=false
SKIP_BUILD=false

usage() {
    cat <<'EOF'
Usage: ./install.sh [options]

Options:
  --prefix PATH        Base install prefix (default: ~/.local)
  --install-dir PATH   Install directory for the distribution
  --bin-dir PATH       Directory for symlinks (default: <prefix>/bin)
  --force              Overwrite existing install directory
  --skip-build         Skip Gradle build (use existing dist)
  -h, --help           Show this help

Examples:
  ./install.sh
  ./install.sh --prefix /usr/local
  ./install.sh --install-dir ~/opt/kodeblok-cli --bin-dir ~/bin
EOF
}

while [ $# -gt 0 ]; do
    case "$1" in
        --prefix)
            PREFIX="${2:-}"
            shift 2
            ;;
        --install-dir)
            INSTALL_DIR="${2:-}"
            shift 2
            ;;
        --bin-dir)
            BIN_DIR="${2:-}"
            shift 2
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [ -z "$PREFIX" ]; then
    echo "Error: --prefix requires a non-empty value." >&2
    exit 1
fi

INSTALL_DIR="${INSTALL_DIR:-$PREFIX/opt/kodeblok-cli}"
BIN_DIR="${BIN_DIR:-$PREFIX/bin}"

if ! $SKIP_BUILD; then
    if [ ! -x "$SCRIPT_DIR/gradlew" ]; then
        echo "Error: gradlew not found at $SCRIPT_DIR" >&2
        exit 1
    fi
    rm -rf "$SCRIPT_DIR/kodeblok-cli/build/dist" "$SCRIPT_DIR/kodeblok-cli/build/jre-macos"
    "$SCRIPT_DIR/gradlew" --no-configuration-cache :kodeblok-cli:assembleMacosDistribution
fi

DIST_DIR="$SCRIPT_DIR/kodeblok-cli/build/dist/kodeblok-cli"
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: distribution not found at $DIST_DIR" >&2
    echo "Run: ./gradlew :kodeblok-cli:assembleMacosDistribution" >&2
    exit 1
fi

if [ -e "$INSTALL_DIR" ]; then
    if $FORCE; then
        rm -rf "$INSTALL_DIR"
    else
        echo "Error: install directory already exists: $INSTALL_DIR" >&2
        echo "Use --force to overwrite." >&2
        exit 1
    fi
fi

mkdir -p "$INSTALL_DIR"
cp -R -p "$DIST_DIR/." "$INSTALL_DIR/"

if [ -d "$INSTALL_DIR/bin" ]; then
    chmod +x "$INSTALL_DIR/bin/"* 2>/dev/null || true
fi

mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/bin/kodeblok-cli" "$BIN_DIR/kodeblok"
ln -sf "$INSTALL_DIR/bin/kodeblok-cli" "$BIN_DIR/kodeblok-cli"

echo "Installed to $INSTALL_DIR"
echo "Symlinks:"
echo "  $BIN_DIR/kodeblok"
echo "  $BIN_DIR/kodeblok-cli"

case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *)
        echo "Note: add $BIN_DIR to your PATH to use kodeblok."
        ;;
esac
