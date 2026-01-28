---
sidebar_position: 3
---

# Smart Casts

Smart cast insights show when Kotlin automatically narrows types based on control flow.

## Overview

Kotlin's compiler tracks type checks and automatically "smart casts" variables to more specific types when it's safe to do so.

## Insight Kinds

### IS_CHECK_CAST

After an `is` type check.

```kotlin
if (x is String) {
    println(x.length)  // x is smart cast to String
}
```

### NULL_CHECK_CAST

After a null check.

```kotlin
if (name != null) {
    println(name.length)  // name is smart cast to String (non-null)
}
```

### WHEN_BRANCH_CAST

In `when` expression branches.

```kotlin
when (value) {
    is Int -> value + 1      // value is Int here
    is String -> value.length // value is String here
}
```

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `originalType` | String | Type before smart cast |
| `narrowedType` | String | Type after smart cast |
| `evidenceKind` | String | What caused the cast |
| `evidencePosition` | Range | Where the check occurred |

## Examples

```kotlin
fun process(input: Any) {
    if (input is String) {
//             ^^^^^^^^^ Evidence: is check
        println(input.uppercase())
//              ^^^^^ SMART_CAST: Any -> String
    }
}
```
