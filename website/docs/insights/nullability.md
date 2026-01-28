---
sidebar_position: 2
---

# Nullability

Nullability insights show how Kotlin's null-safety system works in your code.

## Overview

Kotlin's type system distinguishes between nullable (`String?`) and non-nullable (`String`) types. Kodeblok shows you where nullable types appear and how they're handled.

## Insight Kinds

### NULLABLE_TYPE

Marks a nullable type declaration or inference.

```kotlin
val name: String? = null        // Nullable type
```

### NULL_SAFE_CALL

Shows safe call operator usage (`?.`).

```kotlin
val length = name?.length       // Safe call
```

### ELVIS_OPERATOR

Shows elvis operator usage (`?:`).

```kotlin
val len = name?.length ?: 0     // Elvis operator
```

### NOT_NULL_ASSERTION

Shows non-null assertion operator (`!!`).

```kotlin
val len = name!!.length         // Asserts non-null
```

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `nullableType` | String | The nullable type |
| `isNullable` | Boolean | Whether the type is nullable |
| `isPlatformType` | Boolean | Whether it's a Java platform type |
| `narrowedToNonNull` | Boolean | Whether narrowed to non-null |

## Examples

### Nullable Parameter

```kotlin
fun greet(name: String?) {
//              ^^^^^^^ NULLABILITY: String?
    println("Hello, ${name ?: "guest"}")
//                        ^^ NULLABILITY: Elvis operator
}
```

### Safe Call Chain

```kotlin
val city = user?.address?.city
//             ^ NULLABILITY: safe call
//                      ^ NULLABILITY: safe call
```
