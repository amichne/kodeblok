---
sidebar_position: 10
---

# Delegation

Delegation insights show property and interface delegation patterns.

## Overview

Kotlin's `by` keyword enables delegation for properties (`lazy`, `observable`) and interfaces. Kodeblok reveals the delegate type and generated accessors.

## Insight Kinds

### PROPERTY_DELEGATION

A property is delegated using `by`.

### INTERFACE_DELEGATION

A class delegates interface implementation.

### LAZY_INITIALIZATION

Using `by lazy { }` for lazy initialization.

### OBSERVABLE_DELEGATION

Using `Delegates.observable` or `vetoable`.

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `delegationKind` | String | Type: lazy, observable, vetoable, notNull, map, custom, interface |
| `delegateType` | String | The type of the delegate object |
| `propertyType` | String | The type of the delegated property |
| `delegateExpression` | String? | The delegate expression if available |
| `accessorGenerated` | String | Which accessors: getter, setter, or both |
| `interfaceDelegatedTo` | String? | Interface name if interface delegation |

## Examples

```kotlin
class Example {
    val lazyValue by lazy { computeExpensiveValue() }
    //             ^^^^^^ DELEGATION
    //  delegationKind: "lazy"
    //  delegateType: Lazy<String>
    //  propertyType: String
    //  accessorGenerated: "getter"

    var observed by Delegates.observable("initial") { _, old, new ->
        println("Changed from $old to $new")
    }
    //              ^^^^^^^^^^ DELEGATION
    //  delegationKind: "observable"
    //  accessorGenerated: "both"
}

interface Printer { fun print() }
class ConsolePrinter : Printer { override fun print() = println("Console") }

class Document(printer: Printer) : Printer by printer
//                                         ^^^^^^^^^^ DELEGATION
//  delegationKind: "interface"
//  interfaceDelegatedTo: Printer
```
