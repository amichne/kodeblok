package kodeblok.engine.analysis.extractors

import kodeblok.engine.analysis.AnalysisApiFacade
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.ScopingData
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtLambdaExpression
import org.jetbrains.kotlin.psi.KtNameReferenceExpression
import org.jetbrains.kotlin.psi.KtQualifiedExpression

class ScopingExtractor(
    private val api: AnalysisApiFacade,
    private val level: InsightLevel,
) : InsightExtractor {
    override fun extract(element: KtElement): RawInsight? {
        if (level == InsightLevel.OFF) return null
        if (element !is KtCallExpression) return null
        val callee = element.calleeExpression as? KtNameReferenceExpression ?: return null
        val name = callee.getReferencedName()
        if (name !in SCOPE_FUNCTIONS) return null
        if (!hasLambda(element)) return null

        val receiverType = receiverType(element, name)
        val data = when (name) {
            "let", "also" -> ScopingData(
                scopeFunction = name,
                outerReceiver = null,
                innerReceiver = null,
                itParameterType = receiverType
            )
            else -> ScopingData(
                scopeFunction = name,
                outerReceiver = null,
                innerReceiver = receiverType,
                itParameterType = null
            )
        }

        return RawInsight(
            position = callee.textRange,
            category = InsightCategory.SCOPING,
            level = level,
            kind = InsightKind.SCOPE_FUNCTION_ENTRY,
            data = data,
            tokenText = callee.text
        )
    }

    private fun hasLambda(call: KtCallExpression): Boolean {
        if (call.lambdaArguments.isNotEmpty()) return true
        return call.valueArguments.any { arg -> arg.getArgumentExpression() is KtLambdaExpression }
    }

    private fun receiverType(call: KtCallExpression, name: String): String? {
        val receiverExpression = when (val parent = call.parent) {
            is KtQualifiedExpression -> if (parent.selectorExpression == call) parent.receiverExpression else null
            else -> null
        }
        val targetExpression = receiverExpression ?: if (name == "with") {
            call.valueArguments.firstOrNull()?.getArgumentExpression()
        } else {
            null
        }
        val type = targetExpression?.let { api.expressionType(it) } ?: return null
        return api.renderType(type)
    }

    private companion object {
        val SCOPE_FUNCTIONS = setOf("let", "run", "apply", "also", "with")
    }
}
