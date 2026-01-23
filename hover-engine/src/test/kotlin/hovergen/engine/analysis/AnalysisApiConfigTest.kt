package hovergen.engine.analysis

import hovergen.engine.OriginLocation
import kotlin.test.Test
import kotlin.test.assertFailsWith

class AnalysisApiConfigTest {
    @Test
    fun validateRejectsEmptyClasspath() {
        val config = AnalysisApiConfig(classpath = emptyList())
        val origin = OriginLocation("docs/snippets/sample.kt", 1, 1)

        assertFailsWith<Exception> {
            config.validate(origin)
        }
    }
}
