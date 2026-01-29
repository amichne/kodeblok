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
            val snippetId = fenceInfo.snippetId
            val imports = fenceInfo.imports
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
                    origin = OriginLocation(path.toString(), startLine + 1, 1),
                    imports = imports
                )
            )
            index += 1
        }
        return sources
    }

    private data class FenceInfo(
        val snippetId: String,
        val imports: List<String>,
    )

    private fun parseFenceInfo(line: String): FenceInfo? {
        val trimmed = line.trim()
        if (!trimmed.startsWith("```") || !trimmed.contains("kotlin")) {
            return null
        }
        if (!trimmed.startsWith("```kotlin")) {
            return null
        }
        val attributes = parseFenceAttributes(trimmed.removePrefix("```kotlin").trim())
        val rawId = attributes["id"]
            ?: attributes["snippet:id"]
            ?: throw HoverEngineException("Missing id in kotlin fence: $line")
        val snippetId = rawId.trim()
        if (snippetId.isBlank()) {
            throw HoverEngineException("Blank id in kotlin fence: $line")
        }
        val importsRaw = attributes["imports"]?.trim().orEmpty()
        val imports = if (importsRaw.isBlank()) {
            emptyList()
        } else {
            parseImports(importsRaw)
        }
        if (attributes.containsKey("imports") && imports.isEmpty()) {
            throw HoverEngineException("Empty imports in kotlin fence: $line")
        }
        return FenceInfo(snippetId = snippetId, imports = imports)
    }

    private fun parseFenceAttributes(raw: String): Map<String, String> {
        if (raw.isBlank()) return emptyMap()
        val attributes = mutableMapOf<String, String>()
        val regex = Regex("([A-Za-z0-9:_-]+)=((\"[^\"]*\")|('[^']*')|([^\\s]+))")
        regex.findAll(raw).forEach { match ->
            val key = match.groupValues[1]
            val value = match.groupValues[3]
                .ifEmpty { match.groupValues[4] }
                .ifEmpty { match.groupValues[5] }
                .trim('"', '\'')
            attributes[key] = value
        }
        return attributes
    }

    private fun parseImports(raw: String): List<String> =
        raw.split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() }

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
