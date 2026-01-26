package kodeblok.engine.analysis.extractors

import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.LambdaData
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class LambdaExtractorTest {
    @Test
    fun capturesInferredLambdaParameters() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val mapper: (String) -> Int = { it.length }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.LAMBDAS to InsightLevel.HIGHLIGHTS)
        )

        val insight = profile.findInsight(
            category = InsightCategory.LAMBDAS,
            kind = InsightKind.LAMBDA_PARAMETER_INFERRED
        )
        val data = insight.data as LambdaData

        assertEquals("kotlin.Int", data.returnType)
        assertEquals(1, data.parameterTypes.size)
        assertEquals("it", data.parameterTypes.first().name)
        assertEquals("kotlin.String", data.parameterTypes.first().type)
    }

    @Test
    fun skipsExplicitSingleParamLambdaAtHighlightsLevel() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val mapper: (String) -> Int = { value: String -> value.length }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.LAMBDAS to InsightLevel.HIGHLIGHTS)
        )

        profile.assertNoInsights(InsightCategory.LAMBDAS)
    }

    @Test
    fun capturesReturnTypeAtAllLevel() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val mapper: (String) -> Int = { value: String -> value.length }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.LAMBDAS to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.LAMBDAS,
            kind = InsightKind.LAMBDA_RETURN_INFERRED
        )
        val data = insight.data as LambdaData

        assertTrue(data.parameterTypes.isNotEmpty())
        assertEquals("kotlin.Int", data.returnType)
    }
}
