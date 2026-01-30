SHELL := /bin/bash

GRADLE := ./gradlew
PNPM := pnpm

.PHONY: help
help:
	@echo "Targets:"
	@echo "  hovermaps             Generate hover maps via Gradle"
	@echo "  engine-test           Run kodeblok-engine tests"
	@echo "  engine-build          Build kodeblok-engine"
	@echo "  gradle-plugin-build   Build kodeblok-gradle plugin"
	@echo "  cli-jar               Build CLI jar"
	@echo "  cli-dist-macos        Build macOS CLI distribution"
	@echo "  viewer-build          Build react-viewer library"
	@echo "  viewer-check          Typecheck react-viewer"
	@echo "  viewer-demo           Run react-viewer demo site"
	@echo "  docs-build            Build docs-site"
	@echo "  docs-start            Start docs-site"
	@echo "  docs-typecheck        Typecheck docs-site"
	@echo "  build-all-frontend    Build viewer and docs"
	@echo "  check                 Run core checks"
	@echo "  clean                 Clean build outputs"

.PHONY: hovermaps
hovermaps:
	$(GRADLE) generateHoverMaps

.PHONY: engine-test
engine-test:
	$(GRADLE) :kodeblok-engine:test

.PHONY: engine-build
engine-build:
	$(GRADLE) :kodeblok-engine:build

.PHONY: gradle-plugin-build
gradle-plugin-build:
	$(GRADLE) :kodeblok-gradle:build

.PHONY: cli-jar
cli-jar:
	$(GRADLE) :kodeblok-cli:jar

.PHONY: cli-dist-macos
cli-dist-macos:
	$(GRADLE) :kodeblok-cli:assembleMacosDistribution

.PHONY: viewer-build
viewer-build:
	$(PNPM) --filter kodeblok build

.PHONY: viewer-check
viewer-check:
	$(PNPM) --filter kodeblok check

.PHONY: viewer-demo
viewer-demo:
	$(PNPM) --filter kodeblok run demo

.PHONY: docs-build
docs-build:
	$(PNPM) --filter @kodeblok/docs build

.PHONY: docs-start
docs-start:
	$(PNPM) --filter @kodeblok/docs start

.PHONY: docs-typecheck
docs-typecheck:
	$(PNPM) --filter @kodeblok/docs typecheck

.PHONY: build-all-frontend
build-all-frontend: viewer-build docs-build

.PHONY: check
check: engine-test viewer-check docs-typecheck

.PHONY: clean
clean:
	$(GRADLE) clean
	$(PNPM) --filter kodeblok clean
	$(PNPM) --filter @kodeblok/docs clear
