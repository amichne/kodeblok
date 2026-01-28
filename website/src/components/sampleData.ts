import type { SemanticProfile } from './types';

export const SAMPLE_SNIPPET: SemanticProfile = {
  snippetId: "sample-demo",
  codeHash: "abc123",
  code: `fun main() {
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
    {
      id: "1",
      position: { from: { line: 2, col: 5 }, to: { line: 2, col: 12 } },
      category: "TYPE_INFERENCE",
      level: "HIGHLIGHTS",
      kind: "INFERRED_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 10, col: 1 } } }],
      data: { type: "TypeInference", inferredType: "List<Int>", declaredType: null, typeArguments: ["Int"] },
      tokenText: "numbers"
    },
    {
      id: "2",
      position: { from: { line: 3, col: 5 }, to: { line: 3, col: 12 } },
      category: "TYPE_INFERENCE",
      level: "ALL",
      kind: "INFERRED_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 10, col: 1 } } }],
      data: { type: "TypeInference", inferredType: "List<Int>", declaredType: null, typeArguments: ["Int"] },
      tokenText: "doubled"
    },
    {
      id: "3",
      position: { from: { line: 3, col: 23 }, to: { line: 3, col: 26 } },
      category: "LAMBDAS",
      level: "HIGHLIGHTS",
      kind: "LAMBDA_PARAMETER_INFERRED",
      scopeChain: [
        { scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 10, col: 1 } } },
        { scopeId: "lambda1", kind: "LAMBDA", receiverType: null, position: { from: { line: 3, col: 23 }, to: { line: 3, col: 35 } } }
      ],
      data: { type: "Lambda", parameterTypes: [{ name: "it", type: "Int" }], returnType: "Int", inferredFromContext: "map function" },
      tokenText: "map"
    },
    {
      id: "4",
      position: { from: { line: 5, col: 5 }, to: { line: 5, col: 9 } },
      category: "NULLABILITY",
      level: "HIGHLIGHTS",
      kind: "NULLABLE_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 10, col: 1 } } }],
      data: { type: "Nullability", nullableType: "String?", isNullable: true, isPlatformType: false, narrowedToNonNull: false },
      tokenText: "name"
    },
    {
      id: "5",
      position: { from: { line: 6, col: 20 }, to: { line: 6, col: 23 } },
      category: "SCOPING",
      level: "HIGHLIGHTS",
      kind: "SCOPE_FUNCTION_ENTRY",
      scopeChain: [
        { scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 10, col: 1 } } },
        { scopeId: "let1", kind: "SCOPE_FUNCTION", receiverType: "String", position: { from: { line: 6, col: 20 }, to: { line: 6, col: 40 } } }
      ],
      data: { type: "Scoping", scopeFunction: "let", outerReceiver: null, innerReceiver: "String", itParameterType: "String" },
      tokenText: "let"
    },
    {
      id: "6",
      position: { from: { line: 6, col: 5 }, to: { line: 6, col: 13 } },
      category: "TYPE_INFERENCE",
      level: "HIGHLIGHTS",
      kind: "INFERRED_TYPE",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 10, col: 1 } } }],
      data: { type: "TypeInference", inferredType: "String", declaredType: null, typeArguments: null },
      tokenText: "greeting"
    },
    {
      id: "7",
      position: { from: { line: 6, col: 44 }, to: { line: 6, col: 46 } },
      category: "NULLABILITY",
      level: "ALL",
      kind: "ELVIS_OPERATOR",
      scopeChain: [{ scopeId: "main", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 10, col: 1 } } }],
      data: { type: "Nullability", nullableType: "String?", isNullable: true, isPlatformType: false, narrowedToNonNull: true },
      tokenText: "?:"
    }
  ],
  rootScopes: []
};
