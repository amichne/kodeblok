package hovergen.engine.analysis

import hovergen.engine.HoverTarget
import hovergen.engine.NormalizedSnippet
import hovergen.engine.SemanticAnalyzer
import hovergen.engine.WrappedSnippet
import hovergen.schema.HoverMeta

class AnalysisApiSemanticAnalyzer(
    private val config: AnalysisApiConfig
) : SemanticAnalyzer {
    override fun analyze(
        snippet: NormalizedSnippet,
        wrapped: WrappedSnippet,
        targets: List<HoverTarget>,
        kotlinVersion: String
    ): Map<String, HoverMeta> {
        config.validate(snippet.origin)
        return emptyMap()
    }
}
