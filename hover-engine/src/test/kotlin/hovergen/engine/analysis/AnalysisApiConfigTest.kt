package hovergen.engine.analysis

import hovergen.engine.OriginLocation
import org.junit.Test
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
