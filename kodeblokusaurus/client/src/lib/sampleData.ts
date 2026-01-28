import { SemanticProfile } from "./types";

export const SAMPLE_SNIPPET: SemanticProfile = {
  snippetId: "sample-001",
  codeHash: "abc123hash",
  code: `data class Point(val x: Int, val y: Int) {
    operator fun plus(other: Point) = Point(x + other.x, y + other.y)
}

class Canvas {
    val cachedSize by lazy { calculateSize() }

    fun render() {
        val origin = Point(0, 0)
        val offset = Point(10, 20)
        val combined = origin + offset

        val (px, py) = combined
        println("Drawing at ($px, $py)")

        this@Canvas.cachedSize
    }

    private fun calculateSize() = 1024
}

fun processUserData(user: User?, config: Config) {
    val processed = user?.let { u ->
        if (u.isValid()) {
            config.enrich(u)
        } else {
            null
        }
    } ?: getDefaultUser()

    val result = processed.transform { it.toString() }
    println("Result: $result")
}`,
  rootScopes: [],
  insights: [
    // OPERATOR: plus operator
    {
      id: "ins-op-1",
      position: { from: { line: 11, col: 29 }, to: { line: 11, col: 30 } },
      category: "OPERATORS",
      level: "HIGHLIGHTS",
      kind: "OPERATOR_OVERLOAD",
      tokenText: "+",
      scopeChain: [
        { scopeId: "class-1", kind: "CLASS", receiverType: "Canvas", position: { from: { line: 5, col: 1 }, to: { line: 19, col: 1 } } },
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 17, col: 5 } } }
      ],
      data: {
        type: "Operator",
        operator: "+",
        resolvedFunction: "plus",
        receiverType: "Point",
        parameterTypes: ["Point"],
        returnType: "Point",
        isInfix: false,
        declaringClass: "Point"
      }
    },
    // DELEGATION: lazy delegate
    {
      id: "ins-del-1",
      position: { from: { line: 6, col: 20 }, to: { line: 6, col: 24 } },
      category: "DELEGATION",
      level: "HIGHLIGHTS",
      kind: "PROPERTY_DELEGATION",
      tokenText: "lazy",
      scopeChain: [
        { scopeId: "class-1", kind: "CLASS", receiverType: "Canvas", position: { from: { line: 5, col: 1 }, to: { line: 19, col: 1 } } }
      ],
      data: {
        type: "Delegation",
        delegationKind: "lazy",
        delegateType: "Lazy<Int>",
        propertyType: "Int",
        delegateExpression: "lazy { calculateSize() }",
        accessorGenerated: "getter",
        interfaceDelegatedTo: null
      }
    },
    // DESTRUCTURING: val (px, py)
    {
      id: "ins-des-1",
      position: { from: { line: 13, col: 14 }, to: { line: 13, col: 16 } },
      category: "DESTRUCTURING",
      level: "HIGHLIGHTS",
      kind: "DESTRUCTURING_COMPONENT",
      tokenText: "px",
      scopeChain: [
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 17, col: 5 } } }
      ],
      data: {
        type: "Destructuring",
        sourceType: "Point",
        componentIndex: 1,
        componentFunction: "component1",
        componentType: "Int",
        isDataClass: true,
        variableName: "px"
      }
    },
    {
      id: "ins-des-2",
      position: { from: { line: 13, col: 18 }, to: { line: 13, col: 20 } },
      category: "DESTRUCTURING",
      level: "HIGHLIGHTS",
      kind: "DESTRUCTURING_COMPONENT",
      tokenText: "py",
      scopeChain: [
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 17, col: 5 } } }
      ],
      data: {
        type: "Destructuring",
        sourceType: "Point",
        componentIndex: 2,
        componentFunction: "component2",
        componentType: "Int",
        isDataClass: true,
        variableName: "py"
      }
    },
    // RECEIVER: this@Canvas
    {
      id: "ins-rec-1",
      position: { from: { line: 16, col: 9 }, to: { line: 16, col: 21 } },
      category: "RECEIVERS",
      level: "HIGHLIGHTS",
      kind: "LABELED_THIS",
      tokenText: "this@Canvas",
      scopeChain: [
        { scopeId: "class-1", kind: "CLASS", receiverType: "Canvas", position: { from: { line: 5, col: 1 }, to: { line: 19, col: 1 } } },
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 17, col: 5 } } }
      ],
      data: {
        type: "Receiver",
        receiverType: "Canvas",
        receiverKind: "labeled",
        label: "Canvas",
        scopeDepth: 1,
        alternativeReceivers: []
      }
    },
    // Original insights (adjusted line numbers)
    {
      id: "ins-1",
      position: { from: { line: 23, col: 27 }, to: { line: 23, col: 30 } },
      category: "SCOPING",
      level: "HIGHLIGHTS",
      kind: "SCOPE_FUNCTION_ENTRY",
      tokenText: "let",
      scopeChain: [
        { scopeId: "file-1", kind: "FILE", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 34, col: 1 } } },
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 21, col: 1 }, to: { line: 34, col: 1 } } }
      ],
      data: {
        type: "Scoping",
        scopeFunction: "let",
        outerReceiver: "User?",
        innerReceiver: null,
        itParameterType: "User"
      }
    },
    {
      id: "ins-2",
      position: { from: { line: 23, col: 33 }, to: { line: 23, col: 34 } },
      category: "LAMBDAS",
      level: "ALL",
      kind: "LAMBDA_PARAMETER_INFERRED",
      tokenText: "u",
      scopeChain: [
        { scopeId: "file-1", kind: "FILE", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 34, col: 1 } } },
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 21, col: 1 }, to: { line: 34, col: 1 } } },
        { scopeId: "lambda-1", kind: "LAMBDA", receiverType: null, position: { from: { line: 23, col: 33 }, to: { line: 29, col: 5 } } }
      ],
      data: {
        type: "Lambda",
        parameterTypes: [{ name: "u", type: "User" }],
        returnType: "User?",
        inferredFromContext: "let block"
      }
    },
    {
      id: "ins-3",
      position: { from: { line: 24, col: 15 }, to: { line: 24, col: 22 } },
      category: "SMART_CASTS",
      level: "HIGHLIGHTS",
      kind: "NULL_CHECK_CAST",
      tokenText: "isValid",
      scopeChain: [
        { scopeId: "lambda-1", kind: "LAMBDA", receiverType: null, position: { from: { line: 23, col: 33 }, to: { line: 29, col: 5 } } }
      ],
      data: {
        type: "SmartCast",
        originalType: "User?",
        narrowedType: "User",
        evidencePosition: { from: { line: 23, col: 21 }, to: { line: 23, col: 26 } },
        evidenceKind: "Safe Call"
      }
    },
    {
      id: "ins-4",
      position: { from: { line: 25, col: 20 }, to: { line: 25, col: 26 } },
      category: "EXTENSIONS",
      level: "ALL",
      kind: "EXTENSION_FUNCTION_CALL",
      tokenText: "enrich",
      scopeChain: [
        { scopeId: "lambda-1", kind: "LAMBDA", receiverType: null, position: { from: { line: 23, col: 33 }, to: { line: 29, col: 5 } } }
      ],
      data: {
        type: "Extension",
        functionOrProperty: "enrich",
        extensionReceiverType: "Config",
        resolvedFrom: "ConfigExtensions.kt",
        competingMember: false
      }
    },
    {
      id: "ins-5",
      position: { from: { line: 29, col: 10 }, to: { line: 29, col: 24 } },
      category: "NULLABILITY",
      level: "HIGHLIGHTS",
      kind: "ELVIS_OPERATOR",
      tokenText: "?:",
      scopeChain: [
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 21, col: 1 }, to: { line: 34, col: 1 } } }
      ],
      data: {
        type: "Nullability",
        nullableType: "User",
        isNullable: false,
        isPlatformType: false,
        narrowedToNonNull: true
      }
    },
    {
      id: "ins-6",
      position: { from: { line: 31, col: 28 }, to: { line: 31, col: 37 } },
      category: "TYPE_INFERENCE",
      level: "ALL",
      kind: "INFERRED_TYPE",
      tokenText: "transform",
      scopeChain: [
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 21, col: 1 }, to: { line: 34, col: 1 } } }
      ],
      data: {
        type: "TypeInference",
        inferredType: "String",
        declaredType: null
      }
    },
    {
      id: "ins-7",
      position: { from: { line: 31, col: 40 }, to: { line: 31, col: 42 } },
      category: "LAMBDAS",
      level: "ALL",
      kind: "IMPLICIT_THIS",
      tokenText: "it",
      scopeChain: [
        { scopeId: "lambda-2", kind: "LAMBDA", receiverType: "User", position: { from: { line: 31, col: 38 }, to: { line: 31, col: 53 } } }
      ],
      data: {
        type: "Lambda",
        parameterTypes: [{ name: "it", type: "User" }],
        returnType: "String",
        inferredFromContext: "transform block"
      }
    }
  ]
};
