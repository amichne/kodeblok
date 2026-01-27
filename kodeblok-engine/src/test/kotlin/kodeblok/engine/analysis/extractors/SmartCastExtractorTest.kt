package kodeblok.engine.analysis.extractors

import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.SmartCastData
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SmartCastExtractorTest {
    @Test
    fun capturesIsCheckCast() {
        val profile = analyzeSnippet(
            code = """
                fun consume(x: Any) {
                    if (x is String) {
                        x.length
                    }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.SMART_CASTS to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.SMART_CASTS,
            kind = InsightKind.IS_CHECK_CAST,
            tokenText = "is"
        )
        val data = insight.data as SmartCastData

        assertEquals("kotlin.Any", data.originalType)
        assertEquals("String", data.narrowedType)
        assertEquals(insight.position, data.evidencePosition)
    }

    @Test
    fun capturesNegatedIsCheckExit() {
        val profile = analyzeSnippet(
            code = """
                fun consume(x: Any?) {
                    if (x !is String) return
                    x.length
                }
            """.trimIndent(),
            config = configWith(InsightCategory.SMART_CASTS to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.SMART_CASTS,
            kind = InsightKind.NEGATED_CHECK_EXIT,
            tokenText = "is"
        )
        val data = insight.data as SmartCastData

        assertEquals("String", data.narrowedType)
        assertTrue(data.originalType.endsWith("Any?"))
    }

    @Test
    fun skipsTrivialIsCheckAtHighlightsLevel() {
        val profile = analyzeSnippet(
            code = """
                fun consume(x: String) {
                    if (x is kotlin.String) {
                        x.length
                    }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.SMART_CASTS to InsightLevel.HIGHLIGHTS)
        )

        profile.assertNoInsights(InsightCategory.SMART_CASTS)
    }
}
