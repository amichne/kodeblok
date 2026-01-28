---
sidebar_position: 9
---

# Receivers

Receiver insights show how `this` expressions are resolved in nested contexts.

## Overview

In Kotlin, nested lambdas and extension functions create multiple receiver contexts. Kodeblok shows which receiver is being used and what alternatives exist.

## Insight Kinds

### LABELED_THIS

Explicit `this@Label` reference.

### IMPLICIT_RECEIVER

Implicit `this` resolved in context.

### EXTENSION_RECEIVER

`this` in extension function refers to receiver type.

### DISPATCH_RECEIVER

`this` refers to containing class instance.

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `receiverType` | String | Type of the resolved receiver |
| `receiverKind` | String | One of: dispatch, extension, implicit, labeled |
| `label` | String? | Label if using `this@Label` syntax |
| `scopeDepth` | Number | How many scopes up the receiver is |
| `alternativeReceivers` | String[] | Other receivers in scope (not selected) |

## Examples

```kotlin
class Outer {
    inner class Inner {
        fun example() {
            this@Outer.doSomething()
            // ^^^^^^^^ RECEIVERS
            //  receiverType: Outer
            //  receiverKind: labeled
            //  label: "Outer"
            //  scopeDepth: 1
            //  alternativeReceivers: [Inner]
        }
    }
}

fun String.countWords() = this.split(" ").size
//                        ^^^^ RECEIVERS
//  receiverType: String
//  receiverKind: extension
//  scopeDepth: 0

"Hello World".apply {
    println(this.length)
    //      ^^^^ RECEIVERS
    //  receiverType: String
    //  receiverKind: implicit
    //  scopeDepth: 0
}
```
