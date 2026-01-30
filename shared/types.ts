export type InsightCategory =
  | "TYPE_INFERENCE"
  | "NULLABILITY"
  | "SMART_CASTS"
  | "SCOPING"
  | "EXTENSIONS"
  | "LAMBDAS"
  | "OVERLOADS";

export type InsightLevel = "OFF" | "HIGHLIGHTS" | "ALL";

export type ScopeKind =
  | "FILE"
  | "CLASS"
  | "FUNCTION"
  | "LAMBDA"
  | "SCOPE_FUNCTION"
  | "WHEN_BRANCH"
  | "IF_BRANCH"
  | "TRY_BLOCK"
  | "CATCH_BLOCK";

export type InsightKind =
  // Type Inference
  | "INFERRED_TYPE"
  | "EXPLICIT_TYPE"
  | "GENERIC_ARGUMENT_INFERRED"
  // Nullability
  | "NULLABLE_TYPE"
  | "NULL_SAFE_CALL"
  | "ELVIS_OPERATOR"
  | "NOT_NULL_ASSERTION"
  // Smart Casts
  | "IS_CHECK_CAST"
  | "NEGATED_CHECK_EXIT"
  // Scoping
  | "SCOPE_FUNCTION_ENTRY"
  // Extensions
  | "EXTENSION_FUNCTION_CALL"
  | "EXTENSION_PROPERTY_ACCESS"
  // Lambdas
  | "LAMBDA_PARAMETER_INFERRED"
  | "LAMBDA_RETURN_INFERRED"
  // Overloads
  | "OVERLOAD_RESOLVED"
  | "DEFAULT_ARGUMENT_USED"
  | "NAMED_ARGUMENT_REORDER";

export interface Position {
  line: number;
  col: number;
}

export interface Range {
  from: Position;
  to: Position;
}

export interface ScopeRef {
  scopeId: string;
  kind: ScopeKind;
  receiverType: string | null;
  position: Range;
}

export interface ScopeNode {
  ref: ScopeRef;
  children: ScopeNode[];
  insights: string[];
}

// Insight Data Types

export interface TypeInferenceData {
  type: "TypeInference";
  inferredType: string;
  declaredType?: string | null;
  typeArguments?: string[] | null;
}

export interface NullabilityData {
  type: "Nullability";
  nullableType: string;
  isNullable: boolean;
  isPlatformType: boolean;
  narrowedToNonNull: boolean;
}

export interface SmartCastData {
  type: "SmartCast";
  originalType: string;
  narrowedType: string;
  evidencePosition: Range;
  evidenceKind: string;
}

export interface ScopingData {
  type: "Scoping";
  scopeFunction?: string | null;
  outerReceiver?: string | null;
  innerReceiver?: string | null;
  itParameterType?: string | null;
}

export interface ExtensionData {
  type: "Extension";
  functionOrProperty: string;
  extensionReceiverType: string;
  dispatchReceiverType?: string | null;
  resolvedFrom: string;
  competingMember: boolean;
}

export interface LambdaParam {
  name?: string | null;
  type: string;
}

export interface LambdaData {
  type: "Lambda";
  parameterTypes: LambdaParam[];
  returnType: string;
  inferredFromContext?: string | null;
  samInterface?: string | null;
}

export interface OverloadData {
  type: "Overload";
  selectedSignature: string;
  candidateCount: number;
  resolutionFactors: string[];
  defaultArgumentsUsed?: string[] | null;
}

export type InsightData =
  | TypeInferenceData
  | NullabilityData
  | SmartCastData
  | ScopingData
  | ExtensionData
  | LambdaData
  | OverloadData;

export interface SemanticInsight {
  id: string;
  position: Range;
  category: InsightCategory;
  level: InsightLevel;
  kind: InsightKind;
  scopeChain: ScopeRef[];
  data: InsightData;
  tokenText: string;
}

export interface SemanticProfile {
  snippetId: string;
  codeHash: string;
  code: string;
  insights: SemanticInsight[];
  rootScopes: ScopeNode[];
}
