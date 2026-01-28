---
sidebar_position: 8
---

# Operators

Operator insights show how operator symbols resolve to actual function calls.

## Overview

Kotlin allows operator overloading through convention-based function names. When you use `+`, `-`, `[]`, or other operators, Kodeblok shows which function is actually being called.

## Insight Kinds

### OPERATOR_OVERLOAD

An operator resolves to a custom or standard library function.

### INVOKE_OPERATOR

The `()` operator resolves to an `invoke` function.

### INDEXED_ACCESS

The `[]` operator resolves to `get` or `set` functions.

### AUGMENTED_ASSIGNMENT

Operators like `+=` that may resolve to `plusAssign` or `plus` + assignment.

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `operator` | String | The operator symbol (`+`, `-`, `[]`, etc.) |
| `resolvedFunction` | String | The actual function name (`plus`, `get`, etc.) |
| `receiverType` | String | Type of the left operand |
| `parameterTypes` | String[] | Types of right operand(s) |
| `returnType` | String | Return type of the operation |
| `isInfix` | Boolean | Whether declared as infix |
| `declaringClass` | String | Where the operator is defined |

## Examples

```kotlin
data class Point(val x: Int, val y: Int) {
    operator fun plus(other: Point) = Point(x + other.x, y + other.y)
}

val a = Point(1, 2)
val b = Point(3, 4)
val c = a + b
//        ^ OPERATORS
//  operator: "+"
//  resolvedFunction: "plus"
//  receiverType: Point
//  parameterTypes: [Point]
//  returnType: Point
//  declaringClass: Point

val list = mutableListOf(1, 2, 3)
list[0] = 10
// ^^ OPERATORS: INDEXED_ACCESS
//  operator: "[]="
//  resolvedFunction: "set"
```
