package kodeblok.engine.analysis.extractors

import kodeblok.engine.analysis.AnalysisApiFacade
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.OverloadData
import org.jetbrains.kotlin.analysis.api.resolution.KaFunctionCall
import org.jetbrains.kotlin.analysis.api.resolution.calls
import org.jetbrains.kotlin.analysis.api.signatures.KaCallableSignature
import org.jetbrains.kotlin.analysis.api.symbols.KaCallableSymbol
import org.jetbrains.kotlin.analysis.api.symbols.name
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtElement

class OverloadExtractor(
    private val api: AnalysisApiFacade,
    private val level: InsightLevel,
) : InsightExtractor {
    override fun extract(element: KtElement): RawInsight? {
        if (level == InsightLevel.OFF) return null
        if (element !is KtCallExpression) return null
        val callInfo = api.resolveToCall(element) ?: return null
        val candidates = api.resolveToCallCandidates(element)
        val candidateCount = candidates.size
        val selectedCall = callInfo.calls.firstOrNull() as? KaFunctionCall<*> ?: return null
        val signature = selectedCall.partiallyAppliedSymbol.signature
        val signatureName = signature.nameOrUnknown()

        val namedArgumentsUsed = element.valueArguments.any { it.getArgumentName() != null }
        val defaultArgumentsUsed = defaultArguments(selectedCall)

        val highlights = candidateCount >= 3 || namedArgumentsUsed || defaultArgumentsUsed.isNotEmpty()
        if (level == InsightLevel.HIGHLIGHTS && !highlights) return null

        val factors = mutableListOf<String>()
        if (candidateCount > 1) factors.add("candidates=$candidateCount")
        if (namedArgumentsUsed) factors.add("named-arguments")
        if (defaultArgumentsUsed.isNotEmpty()) factors.add("default-arguments")

        val kind = when {
            defaultArgumentsUsed.isNotEmpty() -> InsightKind.DEFAULT_ARGUMENT_USED
            namedArgumentsUsed -> InsightKind.NAMED_ARGUMENT_REORDER
            else -> InsightKind.OVERLOAD_RESOLVED
        }

        val callee = element.calleeExpression
        val position = callee?.textRange ?: element.textRange
        val tokenText = callee?.text ?: element.text

        return RawInsight(
            position = position,
            category = InsightCategory.OVERLOADS,
            level = level,
            kind = kind,
            data = OverloadData(
                selectedSignature = signatureName,
                candidateCount = candidateCount,
                resolutionFactors = factors,
                defaultArgumentsUsed = defaultArgumentsUsed.ifEmpty { null }
            ),
            tokenText = tokenText
        )
    }

    private fun defaultArguments(call: KaFunctionCall<*>): List<String> {
        val usedParams = call.argumentMapping.values.map { it.symbol }.toSet()
        val allParams = call.partiallyAppliedSymbol.signature.valueParameters.map { it.symbol }
        return allParams.filter { it.hasDefaultValue && it !in usedParams }.map { it.name.asString() }
    }
}
