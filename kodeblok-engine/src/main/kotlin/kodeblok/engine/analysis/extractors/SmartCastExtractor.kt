package kodeblok.engine.analysis.extractors

import kodeblok.engine.analysis.AnalysisApiFacade
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.Position
import kodeblok.schema.Range
import kodeblok.schema.SmartCastData
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtIsExpression

class SmartCastExtractor(
    private val api: AnalysisApiFacade,
    private val level: InsightLevel,
) : InsightExtractor {
    override fun extract(element: KtElement): RawInsight? {
        if (level == InsightLevel.OFF) return null
        if (element !is KtIsExpression) return null

        val targetTypeText = element.typeReference?.text?.trim() ?: return null
        val originalType = api.expressionType(element.leftHandSide)
        val originalRendered = originalType?.let { api.renderType(it) } ?: element.leftHandSide.text
        val kind = if (element.isNegated) InsightKind.NEGATED_CHECK_EXIT else InsightKind.IS_CHECK_CAST
        if (level == InsightLevel.HIGHLIGHTS && !isSignificantNarrowing(originalRendered, targetTypeText)) {
            return null
        }

        return RawInsight(
            position = element.operationReference.textRange,
            category = InsightCategory.SMART_CASTS,
            level = level,
            kind = kind,
            data = SmartCastData(
                originalType = originalRendered,
                narrowedType = targetTypeText,
                evidencePosition = Range(Position(1, 1), Position(1, 1)),
                evidenceKind = kind.name
            ),
            tokenText = "is"
        )
    }

    private fun isSignificantNarrowing(from: String, to: String): Boolean {
        if (from == to) return false
        val fromNullable = from.trim().endsWith("?")
        val toNullable = to.trim().endsWith("?")
        if (fromNullable && !toNullable) return true
        return from.substringBefore("?") != to.substringBefore("?")
    }
}
