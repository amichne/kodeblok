package kodeblok.engine.analysis

import kodeblok.engine.Hashing
import kodeblok.engine.NormalizedSnippet
import kodeblok.engine.OriginLocation
import kodeblok.engine.SnippetNormalizer
import kodeblok.engine.SnippetSource
import kodeblok.engine.SnippetWrapper
import kodeblok.engine.WrappedSnippet
import kodeblok.engine.splitLinesPreserveTrailing
import kodeblok.schema.Position
import kodeblok.schema.Range
import kodeblok.schema.SemanticProfile
import org.jetbrains.kotlin.analysis.api.KaExperimentalApi
import org.jetbrains.kotlin.analysis.api.analyze

@OptIn(KaExperimentalApi::class)
class AnalysisApiEagerAnalyzer(
    private val config: AnalysisApiConfig,
) : EagerSemanticAnalyzer {
    override fun analyze(
        code: String,
        analysisConfig: AnalysisConfig,
        kotlinVersion: String,
    ): SemanticProfile {
        val source = SnippetSource(
            snippetId = "inline",
            rawCode = code,
            origin = OriginLocation("inline", 1, 1)
        )
        val normalized = SnippetNormalizer().normalize(source)
        val wrapped = SnippetWrapper().wrap(normalized)
        return analyzeNormalized(normalized, wrapped, analysisConfig, kotlinVersion)
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
                val scopeBuilder = ScopeTreeBuilder(
                    mapper = mapper,
                    wrapperKind = wrapped.kind,
                    snippetRange = snippetRange
                )
                val collector = InsightCollector(this, analysisConfig, mapper, scopeBuilder)
                val visitor = KtTreeVisitor(collector, scopeBuilder)
                environment.ktFile.accept(visitor)
                SemanticProfile(
                    snippetId = normalized.snippetId,
                    codeHash = Hashing.sha256Hex(normalized.code),
                    code = normalized.code,
                    insights = collector.insights(),
                    rootScopes = scopeBuilder.rootScopes()
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
}
