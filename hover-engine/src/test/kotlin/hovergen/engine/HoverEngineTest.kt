package hovergen.engine

import hovergen.schema.HoverMapJsonWriter
import org.junit.Test
import kotlin.io.path.Path
import kotlin.io.path.readText
import kotlin.test.assertEquals

class HoverEngineTest {
    @Test
    fun generatesHoverMapForSampleSnippet() {
        val rootDir = findProjectRoot()
        val snippetPath = rootDir.resolve("docs/snippets/sample.kt")
        val source = SnippetSource(
            snippetId = "sample",
            rawCode = snippetPath.readText(),
            origin = OriginLocation(snippetPath.toString(), 1, 1)
        )

        val hoverMap = HoverEngine().generateHoverMap(source, ENGINE_KOTLIN_VERSION)
        val actualJson = HoverMapJsonWriter.toJson(hoverMap)
        val expectedJson = rootDir.resolve("hover-engine/src/test/resources/expected/sample.json").readText().trim()

        assertEquals(expectedJson, actualJson)
    }

    private fun findProjectRoot(): java.nio.file.Path {
        var current = Path("").toAbsolutePath()
        while (current.parent != null) {
            if (current.resolve("settings.gradle.kts").toFile().exists()) {
                return current
            }
            current = current.parent
        }
        throw IllegalStateException("Unable to locate project root")
    }
}
