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

export const CATEGORY_COLORS: Record<InsightCategory, string> = {
  TYPE_INFERENCE: "#22d3ee",
  NULLABILITY: "#fb923c",
  SMART_CASTS: "#4ade80",
  SCOPING: "#c084fc",
  EXTENSIONS: "#60a5fa",
  LAMBDAS: "#facc15",
  OVERLOADS: "#f87171",
  OPERATORS: "#f472b6",
  RECEIVERS: "#818cf8",
  DELEGATION: "#2dd4bf",
  DESTRUCTURING: "#fbbf24",
};

export const CATEGORY_LABELS: Record<InsightCategory, string> = {
  TYPE_INFERENCE: "Type Inference",
  NULLABILITY: "Nullability",
  SMART_CASTS: "Smart Casts",
  SCOPING: "Scoping",
  EXTENSIONS: "Extensions",
  LAMBDAS: "Lambdas",
  OVERLOADS: "Overloads",
  OPERATORS: "Operators",
  RECEIVERS: "Receivers",
  DELEGATION: "Delegation",
  DESTRUCTURING: "Destructuring",
};
