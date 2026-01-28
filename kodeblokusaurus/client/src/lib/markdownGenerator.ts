import { SemanticInsight } from "./types";

export function generateHoverMarkdown(insight: SemanticInsight): string {
  const header = `**${insight.category}** • ${insight.kind}`;
  let body = "";

  switch (insight.data.type) {
    case "TypeInference":
      body = `
**Inferred Type**: \`${insight.data.inferredType}\`
${insight.data.declaredType ? `**Declared Type**: \`${insight.data.declaredType}\`` : ""}
`;
      break;

    case "SmartCast":
      body = `
**Smart Cast**: \`${insight.data.originalType}\` → \`${insight.data.narrowedType}\`
**Evidence**: ${insight.data.evidenceKind}
`;
      break;

    case "Scoping":
      body = `
**Scope Function**: \`${insight.data.scopeFunction}\`
**Context**: \`${insight.data.outerReceiver || "Global"}\` → \`${insight.data.innerReceiver || "Unit"}\`
${insight.data.itParameterType ? `**it**: \`${insight.data.itParameterType}\`` : ""}
`;
      break;

    case "Extension":
      body = `
**Extension**: \`${insight.data.functionOrProperty}\`
**Receiver**: \`${insight.data.extensionReceiverType}\`
**Source**: _${insight.data.resolvedFrom}_
`;
      break;

    case "Lambda":
      const params = insight.data.parameterTypes.map(p => `${p.name}: ${p.type}`).join(", ");
      body = `
**Lambda**: \`(${params}) -> ${insight.data.returnType}\`
**Context**: _${insight.data.inferredFromContext}_
`;
      break;

    case "Nullability":
      body = `
**Type**: \`${insight.data.nullableType}\`
**Nullable**: ${insight.data.isNullable ? "Yes" : "No"}
${insight.data.narrowedToNonNull ? "**Status**: Narrowed to Non-Null" : ""}
`;
      break;

    case "Overload":
      body = `
**Selected**: \`${insight.data.selectedSignature}\`
**Candidates**: ${insight.data.candidateCount}
`;
      break;
      
    default:
      body = `No details available.`;
  }

  return `${header}\n\n---\n${body}`;
}
