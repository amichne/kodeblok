---
sidebar_position: 1
---

# Type Inference

Type inference insights show what types the Kotlin compiler determines for variables and expressions.

## Overview

Kotlin has powerful type inference that lets you write `val x = listOf(1, 2, 3)` instead of `val x: List<Int> = listOf(1, 2, 3)`. Kodeblok shows you exactly what types are inferred.

## Insight Kinds

### INFERRED_TYPE

Shows the inferred type for a variable or expression.

```kotlin
val numbers = listOf(1, 2, 3)  // Inferred: List<Int>
val name = "Alice"              // Inferred: String
val pair = 1 to "one"           // Inferred: Pair<Int, String>
```

### EXPLICIT_TYPE

Marks where a type is explicitly declared.

```kotlin
val count: Int = 42             // Explicit: Int
```

### GENERIC_ARGUMENT_INFERRED

Shows inferred generic type arguments.

```kotlin
val map = mapOf(1 to "one")     // K=Int, V=String inferred
```

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `inferredType` | String | The inferred type |
| `declaredType` | String? | Explicitly declared type (if any) |
| `typeArguments` | String[]? | Inferred generic type arguments |

## Examples

### Variable Declaration

```kotlin
val message = "Hello"
//  ^^^^^^^ TYPE_INFERENCE: String
```

### Generic Collection

```kotlin
val items = listOf(1, 2, 3)
//  ^^^^^ TYPE_INFERENCE: List<Int>
//        typeArguments: ["Int"]
```

### Complex Expression

```kotlin
val result = users.filter { it.age > 18 }.map { it.name }
//  ^^^^^^ TYPE_INFERENCE: List<String>
```
