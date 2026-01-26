package kodeblok.engine.analysis.extractors

import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.TypeInferenceData
import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull

class TypeInferenceExtractorTest {
    @Test
    fun infersLambdaParameterType() {
        val profile = analyzeSnippet(
            code = """
                fun demo() {
                    val mapper: (String) -> Int = { value -> value.length }
                }
            """.trimIndent(),
            config = configWith(InsightCategory.TYPE_INFERENCE to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.TYPE_INFERENCE,
            kind = InsightKind.INFERRED_TYPE,
            tokenText = "value"
        )
        val data = insight.data as TypeInferenceData

        assertEquals("kotlin.String", data.inferredType)
        assertEquals(null, data.declaredType)
    }

    @Test
    fun reportsExplicitPropertyTypeAtAllLevel() {
        val profile = analyzeSnippet(
            code = """
                val count: Int = 3
            """.trimIndent(),
            config = configWith(InsightCategory.TYPE_INFERENCE to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.TYPE_INFERENCE,
            kind = InsightKind.EXPLICIT_TYPE,
            tokenText = "count"
        )
        val data = insight.data as TypeInferenceData

        assertEquals("Int", data.declaredType)
        assertEquals("kotlin.Int", data.inferredType)
    }

    @Test
    fun reportsGenericArgumentInference() {
        val profile = analyzeSnippet(
            code = """
                val nums = listOf(1, 2, 3)
            """.trimIndent(),
            config = configWith(InsightCategory.TYPE_INFERENCE to InsightLevel.ALL)
        )

        val insight = profile.findInsight(
            category = InsightCategory.TYPE_INFERENCE,
            kind = InsightKind.GENERIC_ARGUMENT_INFERRED,
            tokenText = "listOf"
        )
        val data = insight.data as TypeInferenceData

        assertNotNull(data.typeArguments)
        assertEquals(listOf("kotlin.Int"), data.typeArguments)
    }
}
