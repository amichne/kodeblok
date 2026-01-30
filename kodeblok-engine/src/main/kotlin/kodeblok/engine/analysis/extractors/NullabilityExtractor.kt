package kodeblok.engine.analysis.extractors

import kodeblok.engine.analysis.AnalysisApiFacade
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.NullabilityData
import org.jetbrains.kotlin.lexer.KtTokens
import org.jetbrains.kotlin.psi.KtBinaryExpression
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtPostfixExpression
import org.jetbrains.kotlin.psi.KtSafeQualifiedExpression
import org.jetbrains.kotlin.psi.KtTypeReference

class NullabilityExtractor(
    private val api: AnalysisApiFacade,
    private val level: InsightLevel,
) : InsightExtractor {
    override fun extract(element: KtElement): RawInsight? {
        if (level == InsightLevel.OFF) return null
        return when (element) {
            is KtSafeQualifiedExpression -> safeCall(element)
            is KtBinaryExpression -> elvis(element)
            is KtPostfixExpression -> notNullAssertion(element)
            is KtTypeReference -> nullableType(element)
            else -> null
        }
    }

    private fun safeCall(expression: KtSafeQualifiedExpression): RawInsight? {
        val receiver = expression.receiverExpression
        val type = api.expressionType(receiver) ?: return null
        val rendered = api.renderType(type)
        val isNullable = api.isMarkedNullable(type)
        return RawInsight(
            position = receiver.textRange,
            category = InsightCategory.NULLABILITY,
            level = level,
            kind = InsightKind.NULL_SAFE_CALL,
            data = NullabilityData(
                nullableType = rendered,
                isNullable = isNullable,
                isPlatformType = false,
                narrowedToNonNull = false
            ),
            tokenText = receiver.text
        )
    }

    private fun elvis(expression: KtBinaryExpression): RawInsight? {
        if (expression.operationToken != KtTokens.ELVIS) return null
        val left = expression.left ?: return null
        val type = api.expressionType(left)
        val rendered = type?.let { api.renderType(it) } ?: left.text
        val isNullable = type?.let { api.isMarkedNullable(it) } ?: rendered.endsWith("?")
        return RawInsight(
            position = expression.operationReference.textRange,
            category = InsightCategory.NULLABILITY,
            level = level,
            kind = InsightKind.ELVIS_OPERATOR,
            data = NullabilityData(
                nullableType = rendered,
                isNullable = isNullable,
                isPlatformType = false,
                narrowedToNonNull = false
            ),
            tokenText = "?:"
        )
    }

    private fun notNullAssertion(expression: KtPostfixExpression): RawInsight? {
        if (expression.operationToken != KtTokens.EXCLEXCL) return null
        val base = expression.baseExpression ?: return null
        val type = api.expressionType(base)
        val rendered = type?.let { api.renderType(it) } ?: base.text
        val isNullable = type?.let { api.isMarkedNullable(it) } ?: rendered.endsWith("?")
        return RawInsight(
            position = expression.operationReference.textRange,
            category = InsightCategory.NULLABILITY,
            level = level,
            kind = InsightKind.NOT_NULL_ASSERTION,
            data = NullabilityData(
                nullableType = rendered,
                isNullable = isNullable,
                isPlatformType = false,
                narrowedToNonNull = true
            ),
            tokenText = "!!"
        )
    }

    private fun nullableType(reference: KtTypeReference): RawInsight? {
        val text = reference.text.trim()
        if (!text.endsWith("?")) return null
        if (level == InsightLevel.HIGHLIGHTS) return null
        return RawInsight(
            position = reference.textRange,
            category = InsightCategory.NULLABILITY,
            level = level,
            kind = InsightKind.NULLABLE_TYPE,
            data = NullabilityData(
                nullableType = text,
                isNullable = true,
                isPlatformType = false,
                narrowedToNonNull = false
            ),
            tokenText = text
        )
    }
}
