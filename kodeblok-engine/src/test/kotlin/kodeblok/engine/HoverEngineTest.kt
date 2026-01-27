package kodeblok.engine

import kodeblok.schema.SemanticProfileSerializer
import org.junit.Test
import kotlin.io.path.Path
import kotlin.io.path.readText
import kotlin.test.assertEquals

class HoverEngineTest {
    @Test
    fun generatesSemanticProfileForSampleSnippet() {
        val rootDir = findProjectRoot()
        val snippetPath = rootDir.resolve("docs/snippets/sample.kt")
        val source = SnippetSource(
            snippetId = "sample",
            rawCode = snippetPath.readText(),
            origin = OriginLocation(snippetPath.toString(), 1, 1)
        )

        val profile = KodeblokEngine().generateSemanticProfile(source, ENGINE_KOTLIN_VERSION)
        val actualJson = SemanticProfileSerializer.toJson(profile)
        val expectedJson = rootDir.resolve("kodeblok-engine/src/test/resources/expected/sample.json").readText().trim()

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
