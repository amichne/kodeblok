package kodeblok.engine.analysis.extractors

import kodeblok.engine.analysis.AnalysisApiFacade
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.TypeInferenceData
import org.jetbrains.kotlin.analysis.api.resolution.KaCallableMemberCall
import org.jetbrains.kotlin.analysis.api.resolution.calls
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtParameter
import org.jetbrains.kotlin.psi.KtProperty

class TypeInferenceExtractor(
    private val api: AnalysisApiFacade,
    private val level: InsightLevel,
) : InsightExtractor {
    override fun extract(element: KtElement): RawInsight? {
        if (level == InsightLevel.OFF) return null
        return when (element) {
            is KtProperty -> extractProperty(element)
            is KtParameter -> extractParameter(element)
            is KtCallExpression -> extractGenericInference(element)
            else -> null
        }
    }

    private fun extractProperty(property: KtProperty): RawInsight? {
        val nameIdentifier = property.nameIdentifier ?: return null
        val declaredType = property.typeReference?.text?.trim()
        val inferredType = api.propertyReturnType(property)?.let { api.renderType(it) }
        return when {
            declaredType == null && inferredType != null -> RawInsight(
                position = nameIdentifier.textRange,
                category = InsightCategory.TYPE_INFERENCE,
                level = level,
                kind = InsightKind.INFERRED_TYPE,
                data = TypeInferenceData(
                    inferredType = inferredType,
                    declaredType = null,
                    typeArguments = null
                ),
                tokenText = nameIdentifier.text
            )
            declaredType != null && level == InsightLevel.ALL -> RawInsight(
                position = nameIdentifier.textRange,
                category = InsightCategory.TYPE_INFERENCE,
                level = level,
                kind = InsightKind.EXPLICIT_TYPE,
                data = TypeInferenceData(
                    inferredType = inferredType ?: declaredType,
                    declaredType = declaredType,
                    typeArguments = null
                ),
                tokenText = nameIdentifier.text
            )
            else -> null
        }
    }

    private fun extractParameter(parameter: KtParameter): RawInsight? {
        val nameIdentifier = parameter.nameIdentifier ?: return null
        val declaredType = parameter.typeReference?.text?.trim()
        val inferredType = api.parameterReturnType(parameter)?.let { api.renderType(it) }
        return when {
            declaredType == null && inferredType != null -> RawInsight(
                position = nameIdentifier.textRange,
                category = InsightCategory.TYPE_INFERENCE,
                level = level,
                kind = InsightKind.INFERRED_TYPE,
                data = TypeInferenceData(
                    inferredType = inferredType,
                    declaredType = null,
                    typeArguments = null
                ),
                tokenText = nameIdentifier.text
            )
            declaredType != null && level == InsightLevel.ALL -> RawInsight(
                position = nameIdentifier.textRange,
                category = InsightCategory.TYPE_INFERENCE,
                level = level,
                kind = InsightKind.EXPLICIT_TYPE,
                data = TypeInferenceData(
                    inferredType = inferredType ?: declaredType,
                    declaredType = declaredType,
                    typeArguments = null
                ),
                tokenText = nameIdentifier.text
            )
            else -> null
        }
    }

    private fun extractGenericInference(callExpression: KtCallExpression): RawInsight? {
        if (callExpression.typeArguments.isNotEmpty()) return null
        val callInfo = api.resolveToCall(callExpression) ?: return null
        val call = callInfo.calls.firstOrNull() as? KaCallableMemberCall<*, *> ?: return null
        if (call.typeArgumentsMapping.isEmpty()) return null
        val callee = callExpression.calleeExpression ?: return null
        val typeArguments = call.typeArgumentsMapping.entries
            .sortedBy { it.key.name.asString() }
            .map { api.renderType(it.value) }
        if (level == InsightLevel.HIGHLIGHTS && typeArguments.isEmpty()) {
            return null
        }
        val inferredType = api.renderType(call.partiallyAppliedSymbol.signature.returnType)
        return RawInsight(
            position = callee.textRange,
            category = InsightCategory.TYPE_INFERENCE,
            level = level,
            kind = InsightKind.GENERIC_ARGUMENT_INFERRED,
            data = TypeInferenceData(
                inferredType = inferredType,
                declaredType = null,
                typeArguments = typeArguments
            ),
            tokenText = callee.text
        )
    }
}
