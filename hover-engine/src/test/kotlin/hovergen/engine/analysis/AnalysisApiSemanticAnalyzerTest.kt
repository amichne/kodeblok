package hovergen.engine.analysis

import hovergen.engine.ENGINE_KOTLIN_VERSION
import hovergen.engine.MarkerParser
import hovergen.engine.OriginLocation
import hovergen.engine.SnippetSource
import hovergen.engine.SnippetWrapper
import hovergen.engine.TokenLocator
import org.junit.Test
import kotlin.test.assertEquals

class AnalysisApiSemanticAnalyzerTest {
    @Test
    fun extractsExprAndReceiverTypes() {
        val source = SnippetSource(
            snippetId = "analysis",
            rawCode = """
                val s = "hi"
                s.length /*hover:id=len*/
            """.trimIndent(),
            origin = OriginLocation("inline", 1, 1)
        )

        val normalized = MarkerParser().parse(source)
        val wrapped = SnippetWrapper().wrap(normalized)
        val targets = TokenLocator().locateTargets(normalized)
        val classpath = System.getProperty("hovergen.classpath")
                            ?.split(java.io.File.pathSeparator)
                            ?.filter { it.isNotBlank() }
                            ?.map { java.nio.file.Path.of(it) }
                        ?: error("Missing hovergen.classpath")
        val analyzer = AnalysisApiSemanticAnalyzer(
            AnalysisApiConfig(classpath = classpath)
        )

        val meta = analyzer.analyze(normalized, wrapped, targets, ENGINE_KOTLIN_VERSION)
        val len = meta.getValue("len")
        assertEquals("kotlin.Int", len.exprType)
        assertEquals("kotlin.String", len.receiverType)
    }
}
