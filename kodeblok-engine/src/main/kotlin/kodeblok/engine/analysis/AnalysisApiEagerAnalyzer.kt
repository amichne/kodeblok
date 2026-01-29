package kodeblok.engine.analysis

import kodeblok.engine.Hashing
import kodeblok.engine.NormalizedSnippet
import kodeblok.engine.OriginLocation
import kodeblok.engine.SnippetNormalizer
import kodeblok.engine.SnippetSource
import kodeblok.engine.SnippetWrapper
import kodeblok.engine.WrappedSnippet
import kodeblok.engine.splitLinesPreserveTrailing
import kodeblok.engine.analysis.extractors.signature
import kodeblok.schema.Position
import kodeblok.schema.Range
import kodeblok.schema.ScopeNode
import kodeblok.schema.SemanticProfile
import kodeblok.schema.InsightLevel
import kodeblok.schema.SemanticInsight
import org.jetbrains.kotlin.analysis.api.KaExperimentalApi
import org.jetbrains.kotlin.analysis.api.KaSession
import org.jetbrains.kotlin.analysis.api.analyze
import org.jetbrains.kotlin.psi.KtFile

@OptIn(KaExperimentalApi::class)
class AnalysisApiEagerAnalyzer(
    private val config: AnalysisApiConfig,
) : EagerSemanticAnalyzer {
    override fun analyze(
        code: String,
        config: AnalysisConfig,
        kotlinVersion: String,
    ): SemanticProfile {
        val source = SnippetSource(
            snippetId = "inline",
            rawCode = code,
            origin = OriginLocation("inline", 1, 1)
        )
        val normalized = SnippetNormalizer().normalize(source)
        val wrapped = SnippetWrapper().wrap(normalized)
        return analyzeNormalized(normalized, wrapped, config, kotlinVersion)
    }

    internal fun analyzeNormalized(
        normalized: NormalizedSnippet,
        wrapped: WrappedSnippet,
        analysisConfig: AnalysisConfig,
        kotlinVersion: String,
    ): SemanticProfile {
        config.validate(normalized.origin)
        val snippetRange = snippetRangeFor(normalized.code)
        AnalysisApiEnvironment.create(wrapped.code, config, kotlinVersion).use { environment ->
            return analyze(environment.ktFile) {
                val mapper = TextRangeMapper(
                    wrappedCode = environment.ktFile.text,
                    lineMap = wrapped.lineMap,
                    snippetRange = snippetRange
                )
                val highlightPass = runInsightPass(
                    ktFile = environment.ktFile,
                    mapper = mapper,
                    wrapperKind = wrapped.kind,
                    snippetRange = snippetRange,
                    config = AnalysisConfig()
                )
                val needsAll = analysisConfig.levels.values.any { it == InsightLevel.ALL }
                val basePass = if (needsAll) {
                    runInsightPass(
                        ktFile = environment.ktFile,
                        mapper = mapper,
                        wrapperKind = wrapped.kind,
                        snippetRange = snippetRange,
                        config = AnalysisConfig(AnalysisConfig.all())
                    )
                } else {
                    highlightPass
                }
                val highlightKeys = highlightPass.insights.map { it.signature() }.toSet()
                val normalizedInsights = basePass.insights.map { insight ->
                    val level = if (highlightKeys.contains(insight.signature())) {
                        InsightLevel.HIGHLIGHTS
                    } else {
                        InsightLevel.ALL
                    }
                    insight.copy(level = level)
                }
                val filteredInsights = filterInsights(normalizedInsights, analysisConfig)
                val filteredScopes = filterScopes(basePass.rootScopes, filteredInsights)
                SemanticProfile(
                    snippetId = normalized.snippetId,
                    codeHash = Hashing.sha256Hex(normalized.code),
                    code = normalized.code,
                    insights = filteredInsights,
                    rootScopes = filteredScopes
                )
            }
        }
    }

    private fun snippetRangeFor(code: String): Range {
        val lines = splitLinesPreserveTrailing(code)
        val lineCount = if (lines.isEmpty()) 1 else lines.size
        val lastLineLength = lines.lastOrNull()?.length ?: 0
        val endCol = if (lastLineLength == 0) 1 else lastLineLength
        return Range(
            from = Position(line = 1, col = 1),
            to = Position(line = lineCount, col = endCol)
        )
    }

    private data class InsightPass(
        val insights: List<SemanticInsight>,
        val rootScopes: List<ScopeNode>,
    )

    private fun KaSession.runInsightPass(
        ktFile: KtFile,
        mapper: TextRangeMapper,
        wrapperKind: kodeblok.engine.WrapperKind,
        snippetRange: Range,
        config: AnalysisConfig,
    ): InsightPass {
        val scopeBuilder = ScopeTreeBuilder(
            mapper = mapper,
            wrapperKind = wrapperKind,
            snippetRange = snippetRange
        )
        val collector = InsightCollector(this, config, mapper, scopeBuilder)
        val visitor = KtTreeVisitor(collector, scopeBuilder)
        ktFile.accept(visitor)
        return InsightPass(
            insights = collector.insights(),
            rootScopes = scopeBuilder.rootScopes()
        )
    }

    private fun filterInsights(
        insights: List<SemanticInsight>,
        config: AnalysisConfig,
    ): List<SemanticInsight> {
        return insights.filter { insight ->
            when (config.levelFor(insight.category)) {
                InsightLevel.OFF -> false
                InsightLevel.HIGHLIGHTS -> insight.level == InsightLevel.HIGHLIGHTS
                InsightLevel.ALL -> true
            }
        }
    }

    private fun filterScopes(
        scopes: List<ScopeNode>,
        insights: List<SemanticInsight>,
    ): List<ScopeNode> {
        val allowedIds = insights.map { it.id }.toSet()
        return scopes.map { scope -> filterScope(scope, allowedIds) }
    }

    private fun filterScope(
        scope: ScopeNode,
        allowedIds: Set<String>,
    ): ScopeNode {
        return scope.copy(
            children = scope.children.map { child -> filterScope(child, allowedIds) },
            insights = scope.insights.filter { it in allowedIds }
        )
    }
}
