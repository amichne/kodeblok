import type { SemanticInsight } from "@shared/types";

export function generateHoverMarkdown(insight: SemanticInsight): string {
  const header = `**${insight.category}** \u2022 ${insight.kind}`;
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
**Smart Cast**: \`${insight.data.originalType}\` \u2192 \`${insight.data.narrowedType}\`
**Evidence**: ${insight.data.evidenceKind}
`;
      break;

    case "Scoping":
      body = `
**Scope Function**: \`${insight.data.scopeFunction}\`
**Context**: \`${insight.data.outerReceiver || "Global"}\` \u2192 \`${insight.data.innerReceiver || "Unit"}\`
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

    case "Lambda": {
      const params = insight.data.parameterTypes.map(p => `${p.name}: ${p.type}`).join(", ");
      body = `
**Lambda**: \`(${params}) -> ${insight.data.returnType}\`
**Context**: _${insight.data.inferredFromContext}_
`;
      break;
    }

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

    case "Operator":
      body = `
**Operator**: \`${insight.data.operator}\` \u2192 \`${insight.data.resolvedFunction}()\`
**Receiver**: \`${insight.data.receiverType}\`
**Returns**: \`${insight.data.returnType}\`
**Declared in**: _${insight.data.declaringClass}_
`;
      break;

    case "Receiver":
      body = `
**Receiver**: \`${insight.data.receiverType}\`
**Kind**: ${insight.data.receiverKind}
${insight.data.label ? `**Label**: \`${insight.data.label}\`` : ""}
**Scope Depth**: ${insight.data.scopeDepth}
`;
      break;

    case "Delegation":
      body = `
**Delegation**: ${insight.data.delegationKind}
**Delegate Type**: \`${insight.data.delegateType}\`
**Property Type**: \`${insight.data.propertyType}\`
**Accessor**: ${insight.data.accessorGenerated}
`;
      break;

    case "Destructuring":
      body = `
**Variable**: \`${insight.data.variableName}\`
**Source**: \`${insight.data.sourceType}\`
**Component**: \`${insight.data.componentFunction}()\` \u2192 \`${insight.data.componentType}\`
${insight.data.isDataClass ? "**Data Class**: Yes" : ""}
`;
      break;

    default:
      body = `No details available.`;
  }

  return `${header}\n\n---\n${body}`;
}
