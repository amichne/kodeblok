package kodeblok.engine.analysis.extractors

import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.NullabilityData
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class NullabilityExtractorTest {
    @Test
    fun capturesSafeCall() {
        val profile = analyzeSnippet(
            code = """
                val s: String? = \"hi\"
                val len = s?.length
            """.trimIndent(),
            config = configWith(InsightCategory.NULLABILITY to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.NULLABILITY,
            kind = InsightKind.NULL_SAFE_CALL,
            tokenText = "s"
        )
        val data = insight.data as NullabilityData

        assertEquals("kotlin.String?", data.type)
        assertTrue(data.isNullable)
    }

    @Test
    fun capturesElvisOperator() {
        val profile = analyzeSnippet(
            code = """
                val s: String? = null
                val res = s ?: \"fallback\"
            """.trimIndent(),
            config = configWith(InsightCategory.NULLABILITY to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.NULLABILITY,
            kind = InsightKind.ELVIS_OPERATOR,
            tokenText = "?:"
        )
        val data = insight.data as NullabilityData

        assertEquals("kotlin.String?", data.type)
        assertTrue(data.isNullable)
    }

    @Test
    fun capturesNotNullAssertion() {
        val profile = analyzeSnippet(
            code = """
                val s: String? = \"hi\"
                val len = s!!.length
            """.trimIndent(),
            config = configWith(InsightCategory.NULLABILITY to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.NULLABILITY,
            kind = InsightKind.NOT_NULL_ASSERTION,
            tokenText = "!!"
        )
        val data = insight.data as NullabilityData

        assertTrue(data.narrowedToNonNull)
    }

    @Test
    fun capturesNullableTypeAtAllLevel() {
        val profile = analyzeSnippet(
            code = """
                val s: String? = \"hi\"
            """.trimIndent(),
            config = configWith(InsightCategory.NULLABILITY to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.NULLABILITY,
            kind = InsightKind.NULLABLE_TYPE,
            tokenText = "String?"
        )
        val data = insight.data as NullabilityData

        assertEquals("String?", data.type)
        assertTrue(data.isNullable)
    }
}
