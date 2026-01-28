import { SemanticProfile } from "./types";

export const SAMPLE_SNIPPET: SemanticProfile = {
  snippetId: "sample-001",
  codeHash: "abc123hash",
  code: `fun processUserData(user: User?, config: Config) {
    val processed = user?.let { u ->
        // Smart cast and scoping magic here
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
    {
      id: "ins-1",
      position: { from: { line: 2, col: 27 }, to: { line: 2, col: 30 } },
      category: "SCOPING",
      level: "HIGHLIGHTS",
      kind: "SCOPE_FUNCTION_ENTRY",
      tokenText: "let",
      scopeChain: [
        { scopeId: "file-1", kind: "FILE", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 14, col: 1 } } },
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 14, col: 1 } } }
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
      position: { from: { line: 2, col: 33 }, to: { line: 2, col: 34 } },
      category: "LAMBDAS",
      level: "ALL",
      kind: "LAMBDA_PARAMETER_INFERRED",
      tokenText: "u",
      scopeChain: [
        { scopeId: "file-1", kind: "FILE", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 14, col: 1 } } },
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 14, col: 1 } } },
        { scopeId: "lambda-1", kind: "LAMBDA", receiverType: null, position: { from: { line: 2, col: 33 }, to: { line: 9, col: 5 } } }
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
      position: { from: { line: 4, col: 15 }, to: { line: 4, col: 22 } },
      category: "SMART_CASTS",
      level: "HIGHLIGHTS",
      kind: "NULL_CHECK_CAST",
      tokenText: "isValid",
      scopeChain: [
        { scopeId: "lambda-1", kind: "LAMBDA", receiverType: null, position: { from: { line: 2, col: 33 }, to: { line: 9, col: 5 } } }
      ],
      data: {
        type: "SmartCast",
        originalType: "User?",
        narrowedType: "User",
        evidencePosition: { from: { line: 2, col: 21 }, to: { line: 2, col: 26 } },
        evidenceKind: "Safe Call"
      }
    },
    {
      id: "ins-4",
      position: { from: { line: 5, col: 20 }, to: { line: 5, col: 26 } },
      category: "EXTENSIONS",
      level: "ALL",
      kind: "EXTENSION_FUNCTION_CALL",
      tokenText: "enrich",
      scopeChain: [
        { scopeId: "lambda-1", kind: "LAMBDA", receiverType: null, position: { from: { line: 2, col: 33 }, to: { line: 9, col: 5 } } }
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
      position: { from: { line: 9, col: 10 }, to: { line: 9, col: 24 } },
      category: "NULLABILITY",
      level: "HIGHLIGHTS",
      kind: "ELVIS_OPERATOR",
      tokenText: "?:",
      scopeChain: [
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 14, col: 1 } } }
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
      position: { from: { line: 11, col: 28 }, to: { line: 11, col: 37 } },
      category: "TYPE_INFERENCE",
      level: "ALL",
      kind: "INFERRED_TYPE",
      tokenText: "transform",
      scopeChain: [
        { scopeId: "fun-1", kind: "FUNCTION", receiverType: null, position: { from: { line: 1, col: 1 }, to: { line: 14, col: 1 } } }
      ],
      data: {
        type: "TypeInference",
        inferredType: "String",
        declaredType: null
      }
    },
    {
      id: "ins-7",
      position: { from: { line: 11, col: 40 }, to: { line: 11, col: 42 } },
      category: "LAMBDAS",
      level: "ALL",
      kind: "IMPLICIT_THIS",
      tokenText: "it",
      scopeChain: [
        { scopeId: "lambda-2", kind: "LAMBDA", receiverType: "User", position: { from: { line: 11, col: 38 }, to: { line: 11, col: 53 } } }
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
