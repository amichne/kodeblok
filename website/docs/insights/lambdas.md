---
sidebar_position: 6
---

# Lambdas

Lambda insights show type inference for lambda expressions.

## Overview

Kotlin infers lambda parameter and return types from context. Kodeblok shows these inferences.

## Insight Kinds

### LAMBDA_PARAMETER_INFERRED

Inferred parameter type (often for `it`).

### LAMBDA_RETURN_INFERRED

Inferred return type.

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `parameterTypes` | Array | List of `{name, type}` |
| `returnType` | String | Inferred return type |
| `inferredFromContext` | String? | What provided context |
| `samInterface` | String? | SAM interface if applicable |

## Examples

```kotlin
val doubled = numbers.map { it * 2 }
//                    ^^^ LAMBDAS
//            parameterTypes: [{name: "it", type: "Int"}]
//            returnType: Int
//            inferredFromContext: "map function"
```
