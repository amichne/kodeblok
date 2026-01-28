---
sidebar_position: 7
---

# Overloads

Overload insights show function overload resolution decisions.

## Overview

When multiple function signatures match a call site, Kotlin selects the most specific one. Kodeblok shows this resolution.

## Insight Kinds

### OVERLOAD_RESOLVED

A specific overload was selected.

### DEFAULT_ARGUMENT_USED

Default parameter values were used.

### NAMED_ARGUMENT_REORDER

Named arguments affected resolution.

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `selectedSignature` | String | The chosen overload |
| `candidateCount` | Number | How many overloads matched |
| `resolutionFactors` | String[] | Why this one was chosen |
| `defaultArgumentsUsed` | String[]? | Which defaults were used |

## Examples

```kotlin
fun log(message: String) { ... }
fun log(message: String, level: Int = 0) { ... }
fun log(message: String, tag: String) { ... }

log("Hello")
//  ^^^^^^^ OVERLOADS
//  selectedSignature: "log(String)"
//  candidateCount: 3
//  resolutionFactors: ["Most specific match"]

log("Hello", level = 1)
//  ^^^^^^^^^^^^^^^^^^ OVERLOADS
//  selectedSignature: "log(String, Int)"
//  defaultArgumentsUsed: []
```
