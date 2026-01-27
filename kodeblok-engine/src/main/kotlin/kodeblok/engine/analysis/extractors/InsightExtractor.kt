package kodeblok.engine.analysis.extractors

import com.intellij.openapi.util.TextRange
import kodeblok.engine.analysis.TextRangeMapper
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightData
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.ScopeRef
import kodeblok.schema.SemanticInsight
import kodeblok.schema.SmartCastData

interface InsightExtractor {
    fun extract(element: org.jetbrains.kotlin.psi.KtElement): RawInsight?
}

data class RawInsight(
    val position: TextRange,
    val category: InsightCategory,
    val level: InsightLevel,
    val kind: InsightKind,
    val data: InsightData,
    val tokenText: String,
) {
    fun toInsight(
        id: String,
        mapper: TextRangeMapper,
        scopeChain: List<ScopeRef>,
    ): SemanticInsight? {
        val range = mapper.toSnippetRange(position) ?: return null
        val resolvedData = when (data) {
            is SmartCastData -> data.copy(evidencePosition = range)
            else -> data
        }
        return SemanticInsight(
            id = id,
            position = range,
            category = category,
            level = level,
            kind = kind,
            scopeChain = scopeChain,
            data = resolvedData,
            tokenText = tokenText
        )
    }
}
