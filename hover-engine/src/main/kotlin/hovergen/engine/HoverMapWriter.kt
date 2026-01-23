package hovergen.engine

import hovergen.schema.HoverMap
import hovergen.schema.HoverMapJsonWriter
import java.nio.file.Files
import java.nio.file.Path

object HoverMapWriter {
    fun write(map: HoverMap, outputDir: Path) {
        val safeName = sanitizeFileName(map.snippetId)
        Files.createDirectories(outputDir)
        val outputPath = outputDir.resolve("$safeName.json")
        Files.writeString(outputPath, HoverMapJsonWriter.toJson(map))
    }

    private fun sanitizeFileName(snippetId: String): String {
        if (snippetId.contains('/') || snippetId.contains('\\')) {
            throw HoverEngineException("Snippet id '$snippetId' contains path separators")
        }
        if (snippetId.contains("..")) {
            throw HoverEngineException("Snippet id '$snippetId' contains path traversal")
        }
        return snippetId
    }
}
