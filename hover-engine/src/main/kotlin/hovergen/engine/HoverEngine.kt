package hovergen.engine

import hovergen.schema.HoverEntry
import hovergen.schema.HoverMap

class HoverEngine(
    private val analyzer: SemanticAnalyzer = NoOpSemanticAnalyzer()
) {
    fun generateHoverMap(source: SnippetSource, kotlinVersion: String): HoverMap {
        validateKotlinVersion(kotlinVersion)

        val normalized = MarkerParser().parse(source)
        ensureUniqueMarkerIds(normalized)

        val wrapper = SnippetWrapper().wrap(normalized)
        val targets = TokenLocator().locateTargets(normalized)
        val metaById = analyzer.analyze(normalized, wrapper, targets, kotlinVersion)

        val entries = targets.map { target ->
            val meta = metaById[target.id]
            HoverEntry(
                id = target.id,
                from = target.range.from,
                to = target.range.to,
                title = meta?.exprType,
                body = HoverRenderer.renderBody(target.tokenText, meta),
                meta = meta
            )
        }

        return HoverMap(
            snippetId = normalized.snippetId,
            codeHash = Hashing.sha256Hex(normalized.code),
            code = normalized.code,
            hovers = entries
        )
    }

    private fun ensureUniqueMarkerIds(normalized: NormalizedSnippet) {
        val seen = mutableSetOf<String>()
        normalized.markers.forEach { marker ->
            if (!seen.add(marker.id)) {
                throw HoverEngineException(
                    "Duplicate hover marker id '${marker.id}' in ${normalized.origin.display()}"
                )
            }
        }
    }

    private fun validateKotlinVersion(projectKotlinVersion: String) {
        if (!versionsMatch(projectKotlinVersion, ENGINE_KOTLIN_VERSION)) {
            throw HoverEngineException(
                "Kotlin version mismatch: project=$projectKotlinVersion generator=$ENGINE_KOTLIN_VERSION"
            )
        }
    }

    private fun versionsMatch(project: String, generator: String): Boolean {
        val normalizedProject = normalizeVersion(project)
        val normalizedGenerator = normalizeVersion(generator)
        return normalizedProject == normalizedGenerator
    }

    private fun normalizeVersion(version: String): String =
        version.substringBefore("-").substringBefore("+")
}
