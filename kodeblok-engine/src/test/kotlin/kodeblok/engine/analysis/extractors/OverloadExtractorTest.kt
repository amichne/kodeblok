package kodeblok.engine.analysis.extractors

import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.OverloadData
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class OverloadExtractorTest {
    @Test
    fun capturesDefaultArguments() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val result = listOf(1, 2).joinToString()
                }
            """.trimIndent(),
            config = configWith(InsightCategory.OVERLOADS to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.OVERLOADS,
            kind = InsightKind.DEFAULT_ARGUMENT_USED,
            tokenText = "joinToString"
        )
        val data = insight.data as OverloadData

        val defaultArgs = data.defaultArgumentsUsed
        assertNotNull(defaultArgs)
        assertTrue(defaultArgs.contains("separator"))
    }

    @Test
    fun capturesNamedArgumentReorder() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    fun sum(a: Int, b: Int): Int = a + b
                    val result = sum(b = 2, a = 1)
                }
            """.trimIndent(),
            config = configWith(InsightCategory.OVERLOADS to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.OVERLOADS,
            kind = InsightKind.NAMED_ARGUMENT_REORDER,
            tokenText = "sum"
        )
        val data = insight.data as OverloadData

        assertEquals(listOf("named-arguments"), data.resolutionFactors.filter { it == "named-arguments" })
    }
}
