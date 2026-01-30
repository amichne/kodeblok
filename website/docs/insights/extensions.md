---
sidebar_position: 5
---

# Extensions

Extension insights show how extension functions and properties are resolved.

## Overview

Kotlin allows extending classes with new functionality without inheritance. Kodeblok shows where these extensions come from.

## Insight Kinds

### EXTENSION_FUNCTION_CALL

Call to an extension function.

### EXTENSION_PROPERTY_ACCESS

Access to an extension property.

## Data Fields

| Field | Type | Description |
|-------|------|-------------|
| `functionOrProperty` | String | Name of the extension |
| `extensionReceiverType` | String | Type being extended |
| `resolvedFrom` | String | Package/file source |
| `competingMember` | Boolean | If it shadows a member |

## Examples

```kotlin
"Hello".isBlank()
//      ^^^^^^^^^ EXTENSIONS
//      extensionReceiverType: String
//      resolvedFrom: kotlin.text

listOf(1, 2, 3).sumOf { it }
//              ^^^^^ EXTENSIONS
//      resolvedFrom: kotlin.collections
```
