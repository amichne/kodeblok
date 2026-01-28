---
sidebar_position: 1
---

# Introduction

**Kodeblok** is a semantic insight visualization tool for Kotlin code. It helps you understand what the Kotlin compiler "sees" when it analyzes your code.

## What are Semantic Insights?

When the Kotlin compiler processes your code, it performs many analyses that aren't immediately visible in the source code:

- **Type Inference**: Determining the type of `val x = listOf(1, 2, 3)` is `List<Int>`
- **Smart Casts**: Automatically narrowing `Any` to `String` after an `is String` check
- **Scope Functions**: Understanding how `let`, `run`, `apply` change the receiver
- **Extension Resolution**: Knowing where `myString.isBlank()` comes from

Kodeblok makes all of these insights visible and explorable.

## Quick Start

1. **Try the Playground**: Visit the [Playground](/playground) to explore sample code with insights
2. **Upload Your Own**: Export a `SemanticProfile` JSON from the Kodeblok CLI and upload it
3. **Explore Insights**: Click on highlighted code or items in the list to see details

## Insight Categories

Kodeblok tracks seven categories of semantic insights:

| Category | Color | Description |
|----------|-------|-------------|
| Type Inference | 🔵 Cyan | Inferred types for variables and expressions |
| Nullability | 🟠 Orange | Nullable types and null-safety operations |
| Smart Casts | 🟢 Green | Automatic type narrowing after checks |
| Scoping | 🟣 Purple | Scope function context changes |
| Extensions | 🔷 Blue | Extension function/property resolution |
| Lambdas | 🟡 Yellow | Lambda parameter and return type inference |
| Overloads | 🔴 Red | Function overload resolution |

## Architecture

Kodeblok consists of several components:

- **kodeblok-engine**: Core analysis engine using K2 Analysis API
- **kodeblok-cli**: Command-line tool for generating insights
- **kodeblok-gradle**: Gradle plugin for build integration
- **kodeblok-schema**: Data model definitions
- **website**: This documentation and playground
