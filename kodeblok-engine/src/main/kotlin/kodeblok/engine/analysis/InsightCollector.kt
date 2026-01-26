package kodeblok.engine.analysis

import kodeblok.engine.analysis.extractors.ExtensionExtractor
import kodeblok.engine.analysis.extractors.InsightExtractor
import kodeblok.engine.analysis.extractors.LambdaExtractor
import kodeblok.engine.analysis.extractors.NullabilityExtractor
import kodeblok.engine.analysis.extractors.OverloadExtractor
import kodeblok.engine.analysis.extractors.ScopingExtractor
import kodeblok.engine.analysis.extractors.SmartCastExtractor
import kodeblok.engine.analysis.extractors.TypeInferenceExtractor
import kodeblok.schema.InsightCategory
import kodeblok.schema.SemanticInsight
import org.jetbrains.kotlin.analysis.api.KaSession
import org.jetbrains.kotlin.psi.KtElement

class InsightCollector(
    session: KaSession,
    private val config: AnalysisConfig,
    private val mapper: TextRangeMapper,
    private val scopeBuilder: ScopeTreeBuilder,
) {
    private val api = AnalysisApiFacade(session)
    private val extractors: List<InsightExtractor> = listOf(
        TypeInferenceExtractor(api, config.levelFor(InsightCategory.TYPE_INFERENCE)),
        NullabilityExtractor(api, config.levelFor(InsightCategory.NULLABILITY)),
        SmartCastExtractor(api, config.levelFor(InsightCategory.SMART_CASTS)),
        ScopingExtractor(api, config.levelFor(InsightCategory.SCOPING)),
        ExtensionExtractor(api, config.levelFor(InsightCategory.EXTENSIONS)),
        LambdaExtractor(api, config.levelFor(InsightCategory.LAMBDAS)),
        OverloadExtractor(api, config.levelFor(InsightCategory.OVERLOADS)),
    )
    private val collected = mutableListOf<SemanticInsight>()
    private var counter = 0

    fun examine(element: KtElement) {
        for (extractor in extractors) {
            val raw = extractor.extract(element) ?: continue
            val insightId = nextId()
            val insight = raw.toInsight(insightId, mapper, scopeBuilder.currentChain()) ?: continue
            collected.add(insight)
            scopeBuilder.registerInsight(insightId)
        }
    }

    fun insights(): List<SemanticInsight> = collected.toList()

    private fun nextId(): String = "ins_${counter++.toString().padStart(3, '0')}"
}
