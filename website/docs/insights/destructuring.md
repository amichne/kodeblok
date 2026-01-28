---
sidebar_position: 11
---

# Destructuring

Destructuring insights show how multi-variable declarations resolve to component functions.

## Overview

Kotlin's destructuring declarations (`val (a, b) = pair`) call `componentN()` functions. Kodeblok shows exactly which component function provides each variable.

## Insight Kinds

### DESTRUCTURING_COMPONENT

A variable receives its value from a component function.

### DATA_CLASS_DESTRUCTURE

Destructuring a data class (auto-generated components).

### FOR_LOOP_DESTRUCTURE

Destructuring in a for loop (`for ((k, v) in map)`).

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `sourceType` | String | Type being destructured |
| `componentIndex` | Number | Which component (1-based) |
| `componentFunction` | String | Function name (component1, component2, etc.) |
| `componentType` | String | Type of the extracted value |
| `isDataClass` | Boolean | Whether source is a data class |
| `variableName` | String | Name of the destructured variable |

## Examples

```kotlin
data class Point(val x: Int, val y: Int)

val point = Point(10, 20)
val (x, y) = point
//   ^ DESTRUCTURING
//  variableName: "x"
//  sourceType: Point
//  componentIndex: 1
//  componentFunction: "component1"
//  componentType: Int
//  isDataClass: true

//      ^ DESTRUCTURING
//  variableName: "y"
//  componentIndex: 2
//  componentFunction: "component2"

for ((key, value) in mapOf("a" to 1, "b" to 2)) {
//    ^^^ DESTRUCTURING
//  variableName: "key"
//  sourceType: Map.Entry<String, Int>
//  componentIndex: 1
//  componentFunction: "component1"
//  componentType: String

//         ^^^^^ DESTRUCTURING
//  variableName: "value"
//  componentIndex: 2
//  componentType: Int
}
```
