package kodeblok.engine

import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.isDirectory
import kotlin.io.path.readText

class SnippetExtractor {
    fun extract(
        snippetsDir: Path?,
        docsDir: Path?,
        includeMdx: Boolean,
    ): List<SnippetSource> {
        val sources = mutableListOf<SnippetSource>()
        if (snippetsDir != null) {
            sources.addAll(extractFromSnippetsDir(snippetsDir))
        }
        if (docsDir != null && includeMdx) {
            sources.addAll(extractFromMdx(docsDir))
        }
        ensureUniqueSnippetIds(sources)
        return sources
    }

    private fun extractFromSnippetsDir(snippetsDir: Path): List<SnippetSource> {
        if (!Files.exists(snippetsDir) || !snippetsDir.isDirectory()) {
            return emptyList()
        }
        return Files.walk(snippetsDir)
            .filter { Files.isRegularFile(it) && it.fileName.toString().endsWith(".kt") }
            .map { path ->
                val snippetId = path.fileName.toString().removeSuffix(".kt")
                SnippetSource(
                    snippetId = snippetId,
                    rawCode = path.readText(),
                    origin = OriginLocation(path.toString(), 1, 1)
                )
            }
            .toList()
    }

    private fun extractFromMdx(docsDir: Path): List<SnippetSource> {
        if (!Files.exists(docsDir) || !docsDir.isDirectory()) {
            return emptyList()
        }
        val sources = mutableListOf<SnippetSource>()
        Files.walk(docsDir)
            .filter { Files.isRegularFile(it) && it.fileName.toString().endsWith(".mdx") }
            .forEach { path ->
                sources.addAll(parseMdx(path))
            }
        return sources
    }

    private fun parseMdx(path: Path): List<SnippetSource> {
        val lines = splitLinesPreserveTrailing(path.readText())
        val sources = mutableListOf<SnippetSource>()
        var index = 0
        while (index < lines.size) {
            val line = lines[index]
            val fenceInfo = parseFenceInfo(line)
            if (fenceInfo == null) {
                index += 1
                continue
            }
            val snippetId = fenceInfo
            val startLine = index + 1
            val builder = StringBuilder()
            index += 1
            while (index < lines.size && lines[index].trim() != "```") {
                builder.append(lines[index])
                if (index < lines.size - 1) builder.append("\n")
                index += 1
            }
            if (index >= lines.size) {
                throw HoverEngineException("Unclosed kotlin fence in ${path.toString()}:$startLine")
            }
            sources.add(
                SnippetSource(
                    snippetId = snippetId,
                    rawCode = builder.toString(),
                    origin = OriginLocation(path.toString(), startLine + 1, 1)
                )
            )
            index += 1
        }
        return sources
    }

    private fun parseFenceInfo(line: String): String? {
        val trimmed = line.trim()
        if (!trimmed.startsWith("```") || !trimmed.contains("kotlin")) {
            return null
        }
        if (!trimmed.startsWith("```kotlin")) {
            return null
        }
        val idMatch = Regex("\\bid=([^\\s]+)").find(trimmed)
                      ?: throw HoverEngineException("Missing id in kotlin fence: $line")
        val rawId = idMatch.groupValues[1].trim()
        val snippetId = rawId.trim('"', '\'')
        if (snippetId.isBlank()) {
            throw HoverEngineException("Blank id in kotlin fence: $line")
        }
        return snippetId
    }

    private fun ensureUniqueSnippetIds(sources: List<SnippetSource>) {
        val seen = mutableMapOf<String, OriginLocation>()
        sources.forEach { source ->
            val previous = seen.putIfAbsent(source.snippetId, source.origin)
            if (previous != null) {
                throw HoverEngineException(
                    "Duplicate snippetId '${source.snippetId}' in ${source.origin.display()} and ${previous.display()}"
                )
            }
        }
    }
}
