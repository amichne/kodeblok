import type { SemanticProfile } from "kodeblok";

export const demoSnippet: SemanticProfile = {
  snippetId: "demo-001",
  codeHash: "demo-hash",
  code: `fun greet(user: User?) {
    val name = user?.name ?: "Guest"

    println("Hello, $name")

    val result = user?.let {
        it.id.toString()
    } ?: "unknown"

    println(result)
}`,
  rootScopes: [
    {
      ref: {
        scopeId: "file-1",
        kind: "FILE",
        receiverType: null,
        position: { from: { line: 1, col: 1 }, to: { line: 12, col: 1 } },
      },
      children: [
        {
          ref: {
            scopeId: "fun-1",
            kind: "FUNCTION",
            receiverType: null,
            position: { from: { line: 1, col: 1 }, to: { line: 12, col: 1 } },
          },
          children: [
            {
              ref: {
                scopeId: "scope-1",
                kind: "SCOPE_FUNCTION",
                receiverType: "User",
                position: { from: { line: 7, col: 15 }, to: { line: 9, col: 5 } },
              },
              children: [],
              insights: ["ins-3", "ins-4"],
            },
          ],
          insights: ["ins-1", "ins-2"],
        },
      ],
      insights: [],
    },
  ],
  insights: [
    {
      id: "ins-1",
      position: { from: { line: 2, col: 9 }, to: { line: 2, col: 12 } },
      category: "TYPE_INFERENCE",
      level: "HIGHLIGHTS",
      kind: "INFERRED_TYPE",
      tokenText: "name",
      scopeChain: [
        { scopeId: "file-1", kind: "FILE", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 12, col: 1 } } },
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 12, col: 1 } } },
      ],
      data: {
        type: "TypeInference",
        inferredType: "String",
        declaredType: null,
      },
    },
    {
      id: "ins-2",
      position: { from: { line: 2, col: 22 }, to: { line: 2, col: 23 } },
      category: "NULLABILITY",
      level: "HIGHLIGHTS",
      kind: "ELVIS_OPERATOR",
      tokenText: "?:",
      scopeChain: [
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 12, col: 1 } } },
      ],
      data: {
        type: "Nullability",
        nullableType: "String?",
        isNullable: false,
        isPlatformType: false,
        narrowedToNonNull: true,
      },
    },
    {
      id: "ins-3",
      position: { from: { line: 7, col: 18 }, to: { line: 7, col: 21 } },
      category: "SCOPING",
      level: "HIGHLIGHTS",
      kind: "SCOPE_FUNCTION_ENTRY",
      tokenText: "let",
      scopeChain: [
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 12, col: 1 } } },
      ],
      data: {
        type: "Scoping",
        scopeFunction: "let",
        outerReceiver: "User?",
        innerReceiver: null,
        itParameterType: "User",
      },
    },
    {
      id: "ins-4",
      position: { from: { line: 8, col: 8 }, to: { line: 8, col: 10 } },
      category: "SMART_CASTS",
      level: "ALL",
      kind: "NULL_CHECK_CAST",
      tokenText: "it",
      scopeChain: [
        { scopeId: "scope-1", kind: "SCOPE_FUNCTION", receiverType: "User", position: { from: { line: 7, col: 15 }, to: { line: 9, col: 5 } } },
      ],
      data: {
        type: "SmartCast",
        originalType: "User?",
        narrowedType: "User",
        evidencePosition: { from: { line: 7, col: 15 }, to: { line: 9, col: 5 } },
        evidenceKind: "Safe Call",
      },
    },
  ],
};
