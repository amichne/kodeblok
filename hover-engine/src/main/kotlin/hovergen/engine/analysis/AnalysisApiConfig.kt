package hovergen.engine.analysis

import hovergen.engine.HoverEngineException
import hovergen.engine.OriginLocation
import java.nio.file.Path

data class AnalysisApiConfig(
    val classpath: List<Path>
) {
    fun validate(origin: OriginLocation) {
        if (classpath.isEmpty()) {
            throw HoverEngineException(
                "Analysis API requires a non-empty classpath (snippet: ${origin.display()})"
            )
        }
    }
}
