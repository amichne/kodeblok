package hovergen.engine.analysis

import hovergen.engine.HoverEngineException
import hovergen.engine.OriginLocation
import java.nio.file.Files
import java.nio.file.Path

data class AnalysisApiConfig(
    val classpath: List<Path>,
    val jdkHome: Path = Path.of(System.getProperty("java.home"))
) {
    fun validate(origin: OriginLocation) {
        if (classpath.isEmpty()) {
            throw HoverEngineException(
                "Analysis API requires a non-empty classpath (snippet: ${origin.display()})"
            )
        }
        if (!Files.exists(jdkHome)) {
            throw HoverEngineException(
                "Analysis API requires a valid JDK home (snippet: ${origin.display()})"
            )
        }
    }
}
