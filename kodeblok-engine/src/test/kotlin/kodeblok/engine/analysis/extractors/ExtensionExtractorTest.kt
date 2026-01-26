package kodeblok.engine.analysis.extractors

import kodeblok.schema.ExtensionData
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ExtensionExtractorTest {
    @Test
    fun capturesExtensionFunctionCall() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val items = listOf(1, 2, 3)
                    val joined = items.joinToString()
                }
            """.trimIndent(),
            config = configWith(InsightCategory.EXTENSIONS to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.EXTENSIONS,
            kind = InsightKind.EXTENSION_FUNCTION_CALL,
            tokenText = "joinToString"
        )
        val data = insight.data as ExtensionData

        assertTrue(data.functionOrProperty.endsWith(".joinToString"))
        assertEquals("kotlin.collections", data.resolvedFrom)
        assertTrue(data.extensionReceiverType.contains("kotlin.collections"))
    }

    @Test
    fun skipsLocalExtensionsAtHighlightsLevel() {
        val profile = analyzeSnippet(
            code = """
                package sample

                fun String.shout(): String = this

                fun demo(): String {
                    return \"hi\".shout()
                }
            """.trimIndent(),
            config = configWith(InsightCategory.EXTENSIONS to InsightLevel.HIGHLIGHTS)
        )

        profile.assertNoInsights(InsightCategory.EXTENSIONS)
    }
}
