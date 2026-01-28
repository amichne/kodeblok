import type { SemanticProfile } from './types';

export const SAMPLE_SNIPPET: SemanticProfile = {
  snippetId: "sample-demo",
  codeHash: "abc123",
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

fun main() {
    val numbers = listOf(1, 2, 3, 4, 5)
    val doubled = numbers.map { it * 2 }

    val name: String? = getUserName()
    val greeting = name?.let { "Hello, $it!" } ?: "Hello, guest!"

    println(greeting)
    println(doubled)
}

fun getUserName(): String? {
    return "Alice"
}`,
  insights: [
    // OPERATOR: plus operator
    {
      id: "op-1",
      position: { from: { line: 11, col: 29 }, to: { line: 11, col: 30 } },
      category: "OPERATORS",
      level: "HIGHLIGHTS",
      kind: "OPERATOR_OVERLOAD",
      tokenText: "+",
      scopeChain: [
        { scopeId: "class-1", kind: "CLASS", receiverType: "Canvas", position: { from: { line: 5, col: 1 }, to: { line: 20, col: 1 } } },
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 18, col: 5 } } }
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
      id: "del-1",
      position: { from: { line: 6, col: 20 }, to: { line: 6, col: 24 } },
      category: "DELEGATION",
      level: "HIGHLIGHTS",
      kind: "PROPERTY_DELEGATION",
      tokenText: "lazy",
      scopeChain: [
        { scopeId: "class-1", kind: "CLASS", receiverType: "Canvas", position: { from: { line: 5, col: 1 }, to: { line: 20, col: 1 } } }
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
      id: "des-1",
      position: { from: { line: 13, col: 14 }, to: { line: 13, col: 16 } },
      category: "DESTRUCTURING",
      level: "HIGHLIGHTS",
      kind: "DESTRUCTURING_COMPONENT",
      tokenText: "px",
      scopeChain: [
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 18, col: 5 } } }
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
      id: "des-2",
      position: { from: { line: 13, col: 18 }, to: { line: 13, col: 20 } },
      category: "DESTRUCTURING",
      level: "HIGHLIGHTS",
      kind: "DESTRUCTURING_COMPONENT",
      tokenText: "py",
      scopeChain: [
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 18, col: 5 } } }
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
      id: "rec-1",
      position: { from: { line: 16, col: 9 }, to: { line: 16, col: 21 } },
      category: "RECEIVERS",
      level: "HIGHLIGHTS",
      kind: "LABELED_THIS",
      tokenText: "this@Canvas",
      scopeChain: [
        { scopeId: "class-1", kind: "CLASS", receiverType: "Canvas", position: { from: { line: 5, col: 1 }, to: { line: 20, col: 1 } } },
        { scopeId: "fun-render", kind: "FUNCTION", receiverType: null, position: { from: { line: 8, col: 5 }, to: { line: 18, col: 5 } } }
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
      id: "1",
      position: { from: { line: 23, col: 5 }, to: { line: 23, col: 12 } },
      category: "TYPE_INFERENCE",
      level: "HIGHLIGHTS",
      kind: "INFERRED_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 22, col: 1 }, to: { line: 31, col: 1 } } }],
      data: { type: "TypeInference", inferredType: "List<Int>", declaredType: null, typeArguments: ["Int"] },
      tokenText: "numbers"
    },
    {
      id: "2",
      position: { from: { line: 24, col: 5 }, to: { line: 24, col: 12 } },
      category: "TYPE_INFERENCE",
      level: "ALL",
      kind: "INFERRED_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 22, col: 1 }, to: { line: 31, col: 1 } } }],
      data: { type: "TypeInference", inferredType: "List<Int>", declaredType: null, typeArguments: ["Int"] },
      tokenText: "doubled"
    },
    {
      id: "3",
      position: { from: { line: 24, col: 23 }, to: { line: 24, col: 26 } },
      category: "LAMBDAS",
      level: "HIGHLIGHTS",
      kind: "LAMBDA_PARAMETER_INFERRED",
      scopeChain: [
        { scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 22, col: 1 }, to: { line: 31, col: 1 } } },
        { scopeId: "lambda1", kind: "LAMBDA", receiverType: null, position: { from: { line: 24, col: 23 }, to: { line: 24, col: 35 } } }
      ],
      data: { type: "Lambda", parameterTypes: [{ name: "it", type: "Int" }], returnType: "Int", inferredFromContext: "map function" },
      tokenText: "map"
    },
    {
      id: "4",
      position: { from: { line: 26, col: 5 }, to: { line: 26, col: 9 } },
      category: "NULLABILITY",
      level: "HIGHLIGHTS",
      kind: "NULLABLE_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 22, col: 1 }, to: { line: 31, col: 1 } } }],
      data: { type: "Nullability", nullableType: "String?", isNullable: true, isPlatformType: false, narrowedToNonNull: false },
      tokenText: "name"
    },
    {
      id: "5",
      position: { from: { line: 27, col: 20 }, to: { line: 27, col: 23 } },
      category: "SCOPING",
      level: "HIGHLIGHTS",
      kind: "SCOPE_FUNCTION_ENTRY",
      scopeChain: [
        { scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 22, col: 1 }, to: { line: 31, col: 1 } } },
        { scopeId: "let1", kind: "SCOPE_FUNCTION", receiverType: "String", position: { from: { line: 27, col: 20 }, to: { line: 27, col: 40 } } }
      ],
      data: { type: "Scoping", scopeFunction: "let", outerReceiver: null, innerReceiver: "String", itParameterType: "String" },
      tokenText: "let"
    },
    {
      id: "6",
      position: { from: { line: 27, col: 5 }, to: { line: 27, col: 13 } },
      category: "TYPE_INFERENCE",
      level: "HIGHLIGHTS",
      kind: "INFERRED_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 22, col: 1 }, to: { line: 31, col: 1 } } }],
      data: { type: "TypeInference", inferredType: "String", declaredType: null, typeArguments: null },
      tokenText: "greeting"
    },
    {
      id: "7",
      position: { from: { line: 27, col: 44 }, to: { line: 27, col: 46 } },
      category: "NULLABILITY",
      level: "ALL",
      kind: "ELVIS_OPERATOR",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 22, col: 1 }, to: { line: 31, col: 1 } } }],
      data: { type: "Nullability", nullableType: "String?", isNullable: true, isPlatformType: false, narrowedToNonNull: true },
      tokenText: "?:"
    }
  ],
  rootScopes: []
};
