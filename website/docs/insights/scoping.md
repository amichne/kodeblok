---
sidebar_position: 4
---

# Scoping

Scoping insights show how scope functions change the receiver context.

## Overview

Kotlin's scope functions (`let`, `run`, `with`, `apply`, `also`) create new scopes where `this` or `it` refers to different objects.

## Insight Kinds

### SCOPE_FUNCTION_ENTRY

Entry point of a scope function.

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `scopeFunction` | String | Name of the scope function |
| `outerReceiver` | String? | Receiver before entering |
| `innerReceiver` | String? | Receiver inside the scope |
| `itParameterType` | String? | Type of `it` parameter |

## Scope Function Summary

| Function | Object Reference | Return Value |
|----------|-----------------|--------------|
| `let` | `it` | Lambda result |
| `run` | `this` | Lambda result |
| `with` | `this` | Lambda result |
| `apply` | `this` | Context object |
| `also` | `it` | Context object |

## Examples

```kotlin
val result = "Hello".let { greeting ->
//                   ^^^ SCOPING: let
//                       innerReceiver: null, it: String
    greeting.uppercase()
}

user.apply {
//   ^^^^^ SCOPING: apply
//         innerReceiver: User
    name = "Alice"   // this.name implicitly
    age = 30         // this.age implicitly
}
```
