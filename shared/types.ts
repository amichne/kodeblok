export type InsightCategory =
  | "TYPE_INFERENCE"
  | "NULLABILITY"
  | "SMART_CASTS"
  | "SCOPING"
  | "EXTENSIONS"
  | "LAMBDAS"
  | "OVERLOADS"
  | "OPERATORS"
  | "RECEIVERS"
  | "DELEGATION"
  | "DESTRUCTURING";

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
  | "PLATFORM_TYPE"
  | "NULL_SAFE_CALL"
  | "ELVIS_OPERATOR"
  | "NOT_NULL_ASSERTION"
  // Smart Casts
  | "IS_CHECK_CAST"
  | "WHEN_BRANCH_CAST"
  | "NEGATED_CHECK_EXIT"
  | "NULL_CHECK_CAST"
  // Scoping
  | "RECEIVER_CHANGE"
  | "IMPLICIT_THIS"
  | "SCOPE_FUNCTION_ENTRY"
  // Extensions
  | "EXTENSION_FUNCTION_CALL"
  | "EXTENSION_PROPERTY_ACCESS"
  | "MEMBER_VS_EXTENSION_RESOLUTION"
  // Lambdas
  | "LAMBDA_PARAMETER_INFERRED"
  | "LAMBDA_RETURN_INFERRED"
  | "SAM_CONVERSION"
  | "TRAILING_LAMBDA"
  // Overloads
  | "OVERLOAD_RESOLVED"
  | "DEFAULT_ARGUMENT_USED"
  | "NAMED_ARGUMENT_REORDER"
  // Operators
  | "OPERATOR_OVERLOAD"
  | "OPERATOR_PLUS"
  | "OPERATOR_MINUS"
  | "OPERATOR_TIMES"
  | "OPERATOR_DIV"
  | "OPERATOR_REM"
  | "OPERATOR_RANGE_TO"
  | "OPERATOR_GET"
  | "OPERATOR_SET"
  | "OPERATOR_CONTAINS"
  | "OPERATOR_INVOKE"
  | "OPERATOR_COMPARE"
  | "OPERATOR_EQUALS"
  | "OPERATOR_ITERATOR"
  | "OPERATOR_PLUS_ASSIGN"
  | "OPERATOR_UNARY"
  // Receivers
  | "IMPLICIT_RECEIVER"
  | "LABELED_THIS"
  | "DISPATCH_RECEIVER"
  | "EXTENSION_RECEIVER"
  // Delegation
  | "PROPERTY_DELEGATION"
  | "LAZY_DELEGATION"
  | "OBSERVABLE_DELEGATION"
  | "MAP_DELEGATION"
  | "CUSTOM_DELEGATION"
  | "INTERFACE_DELEGATION"
  // Destructuring
  | "DESTRUCTURING_COMPONENT"
  | "DESTRUCTURING_DECLARATION";

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

export interface OperatorData {
  type: "Operator";
  operator: string;
  resolvedFunction: string;
  receiverType: string;
  parameterTypes: string[];
  returnType: string;
  isInfix: boolean;
  declaringClass: string;
}

export interface ReceiverData {
  type: "Receiver";
  receiverType: string;
  receiverKind: "dispatch" | "extension" | "implicit" | "labeled";
  label?: string | null;
  scopeDepth: number;
  alternativeReceivers: string[];
}

export interface DelegationData {
  type: "Delegation";
  delegationKind: "lazy" | "observable" | "vetoable" | "notNull" | "map" | "custom" | "interface";
  delegateType: string;
  propertyType: string;
  delegateExpression?: string | null;
  accessorGenerated: "getter" | "setter" | "both";
  interfaceDelegatedTo?: string | null;
}

export interface DestructuringData {
  type: "Destructuring";
  sourceType: string;
  componentIndex: number;
  componentFunction: string;
  componentType: string;
  isDataClass: boolean;
  variableName: string;
}

export type InsightData =
  | TypeInferenceData
  | NullabilityData
  | SmartCastData
  | ScopingData
  | ExtensionData
  | LambdaData
  | OverloadData
  | OperatorData
  | ReceiverData
  | DelegationData
  | DestructuringData;

export interface SemanticInsight {
  id: string;
  position: Range;
  category: InsightCategory;
  level: InsightLevel;
  kind: string;
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
