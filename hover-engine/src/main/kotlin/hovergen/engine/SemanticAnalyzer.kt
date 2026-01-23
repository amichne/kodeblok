package hovergen.engine

import hovergen.schema.HoverMeta

interface SemanticAnalyzer {
    fun analyze(
        snippet: NormalizedSnippet,
        wrapped: WrappedSnippet,
        targets: List<HoverTarget>,
        kotlinVersion: String
    ): Map<String, HoverMeta>
}

class NoOpSemanticAnalyzer : SemanticAnalyzer {
    override fun analyze(
        snippet: NormalizedSnippet,
        wrapped: WrappedSnippet,
        targets: List<HoverTarget>,
        kotlinVersion: String
    ): Map<String, HoverMeta> = emptyMap()
}
