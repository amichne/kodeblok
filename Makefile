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
	@echo "  docusaurus-lib-build  Build kodeblock-docusaurus package"
	@echo "  docusaurus-lib-check  Typecheck kodeblock-docusaurus"
	@echo "  website-build         Build Docusaurus website"
	@echo "  website-start         Start Docusaurus website"
	@echo "  website-typecheck     Typecheck Docusaurus website"
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

.PHONY: docusaurus-lib-build
docusaurus-lib-build:
	$(PNPM) -C kodeblock-docusaurus build

.PHONY: docusaurus-lib-check
docusaurus-lib-check:
	$(PNPM) -C kodeblock-docusaurus check

.PHONY: website-build
website-build:
	$(PNPM) -C website build

.PHONY: website-start
website-start:
	$(PNPM) -C website start

.PHONY: website-typecheck
website-typecheck:
	$(PNPM) -C website typecheck

.PHONY: check
check: engine-test docusaurus-lib-check website-typecheck

.PHONY: clean
clean:
	$(GRADLE) clean
	$(PNPM) -C kodeblock-docusaurus clean
	$(PNPM) -C website clear
