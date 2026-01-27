package kodeblok.engine.analysis.extractors

import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.ScopingData
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull

class ScopingExtractorTest {
    @Test
    fun capturesLetScope() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val name: String = \"Ada\"
                    val size = name.let { it.length }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.SCOPING to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.SCOPING,
            kind = InsightKind.SCOPE_FUNCTION_ENTRY,
            tokenText = "let"
        )
        val data = insight.data as ScopingData

        assertEquals("let", data.scopeFunction)
        assertEquals("kotlin.String", data.itParameterType)
        assertNull(data.innerReceiver)
    }

    @Test
    fun capturesWithScope() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val name: String = \"Ada\"
                    val size = with(name) { length }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.SCOPING to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.SCOPING,
            kind = InsightKind.SCOPE_FUNCTION_ENTRY,
            tokenText = "with"
        )
        val data = insight.data as ScopingData

        assertEquals("with", data.scopeFunction)
        assertEquals("kotlin.String", data.innerReceiver)
        assertNull(data.itParameterType)
    }
}
