package kodeblok.engine.analysis

import kodeblok.engine.ENGINE_KOTLIN_VERSION
import kodeblok.engine.OriginLocation
import kodeblok.engine.SnippetNormalizer
import kodeblok.engine.SnippetSource
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AnalysisApiEagerAnalyzerTest {
    @Test
    fun extractsInferredTypes() {
        val source = SnippetSource(
            snippetId = "analysis",
            rawCode = """
                val s = "hi"
                s.length
            """.trimIndent(),
            origin = OriginLocation("inline", 1, 1)
        )
        val normalized = SnippetNormalizer().normalize(source)
        val classpath = System.getProperty("kodeblok.classpath")
            ?.split(java.io.File.pathSeparator)
            ?.filter { it.isNotBlank() }
            ?.map { java.nio.file.Path.of(it) }
            ?: error("Missing kodeblok.classpath")
        val analyzer = AnalysisApiEagerAnalyzer(
            AnalysisApiConfig(classpath = classpath)
        )

        val profile = analyzer.analyze(normalized.code, AnalysisConfig(), ENGINE_KOTLIN_VERSION)
        val inferred = profile.insights.filter { insight ->
            insight.category == InsightCategory.TYPE_INFERENCE && insight.kind == InsightKind.INFERRED_TYPE
        }

        assertTrue(inferred.isNotEmpty(), "Expected at least one inferred type insight")
        val variable = inferred.first { it.tokenText == "s" }
        assertEquals("kotlin.String", (variable.data as kodeblok.schema.TypeInferenceData).inferredType)
    }
}
