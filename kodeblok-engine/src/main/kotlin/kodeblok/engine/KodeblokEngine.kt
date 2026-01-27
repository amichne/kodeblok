package kodeblok.engine

import kodeblok.engine.analysis.AnalysisApiEagerAnalyzer
import kodeblok.engine.analysis.AnalysisConfig
import kodeblok.engine.analysis.EagerSemanticAnalyzer
import kodeblok.engine.analysis.NoOpEagerSemanticAnalyzer
import kodeblok.schema.SemanticProfile

class KodeblokEngine(
    private val analyzer: EagerSemanticAnalyzer = NoOpEagerSemanticAnalyzer(),
) {
    fun generateSemanticProfile(
        source: SnippetSource,
        kotlinVersion: String,
        analysisConfig: AnalysisConfig = AnalysisConfig(),
    ): SemanticProfile {
        validateKotlinVersion(kotlinVersion)

        val normalized = SnippetNormalizer().normalize(source)
        val profile = if (analyzer is AnalysisApiEagerAnalyzer) {
            val wrapped = SnippetWrapper().wrap(normalized)
            analyzer.analyzeNormalized(normalized, wrapped, analysisConfig, kotlinVersion)
        } else {
            analyzer.analyze(normalized.code, analysisConfig, kotlinVersion)
        }

        return profile.copy(
            snippetId = normalized.snippetId,
            codeHash = Hashing.sha256Hex(normalized.code),
            code = normalized.code
        )
    }

    private fun validateKotlinVersion(projectKotlinVersion: String) {
        if (!versionsMatch(projectKotlinVersion, ENGINE_KOTLIN_VERSION)) {
            throw HoverEngineException(
                "Kotlin version mismatch: project=$projectKotlinVersion generator=$ENGINE_KOTLIN_VERSION"
            )
        }
    }

    private fun versionsMatch(
        project: String,
        generator: String,
    ): Boolean {
        val normalizedProject = normalizeVersion(project)
        val normalizedGenerator = normalizeVersion(generator)
        return normalizedProject == normalizedGenerator
    }

    private fun normalizeVersion(version: String): String =
        version.substringBefore("-").substringBefore("+")
}
