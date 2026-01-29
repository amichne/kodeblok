package kodeblok.engine

private val topLevelDeclarationRegex = Regex("^(fun|class|object|interface|typealias|val|var)\\b")
private val preambleLineRegex = Regex("^(package|import)\\b")

class SnippetWrapper {
    fun wrap(snippet: NormalizedSnippet): WrappedSnippet {
        val kind = classifySnippet(snippet.code)
        val importLines = renderImports(snippet.imports)
        if (kind == SnippetKind.FILE_LEVEL) {
            if (importLines.isNotEmpty() && hasPackageDeclaration(snippet.code)) {
                throw HoverEngineException(
                    "Snippet ${snippet.snippetId} uses imports metadata but is file-level. " +
                        "Remove metadata imports or move imports into the snippet itself."
                )
            }
            if (importLines.isNotEmpty()) {
                val builder = StringBuilder()
                importLines.forEach { line ->
                    builder.append(line).append("\n")
                }
                builder.append(snippet.code)
                return WrappedSnippet(
                    code = builder.toString(),
                    lineMap = LineMap(lineOffset = importLines.size),
                    kind = WrapperKind.FILE_LEVEL
                )
            }
            return WrappedSnippet(
                code = snippet.code,
                lineMap = LineMap(lineOffset = 0),
                kind = WrapperKind.FILE_LEVEL
            )
        }
        if (kind == SnippetKind.PREAMBLE_ONLY) {
            throw HoverEngineException(
                "Snippet ${snippet.snippetId} contains package/import lines without a top-level declaration. " +
                    "Use imports metadata for short snippets or add a declaration."
            )
        }

        val builder = StringBuilder()
        builder.append("package kodeblok\n")
        importLines.forEach { line ->
            builder.append(line).append("\n")
        }
        builder.append("fun __snippet__() {\n")
        builder.append(snippet.code)
        if (!snippet.code.endsWith("\n")) {
            builder.append("\n")
        }
        builder.append("}\n")

        return WrappedSnippet(
            code = builder.toString(),
            lineMap = LineMap(lineOffset = 2 + importLines.size),
            kind = WrapperKind.WRAPPED_FUNCTION
        )
    }

    private fun classifySnippet(code: String): SnippetKind {
        val lines = splitLinesPreserveTrailing(code)
        var hasTopLevelDeclaration = false
        var hasPreamble = false
        for (line in lines) {
            if (line.isBlank()) continue
            val trimmed = line.trimStart()
            if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                continue
            }
            if (line.first().isWhitespace()) {
                return SnippetKind.WRAPPED
            }
            if (preambleLineRegex.containsMatchIn(line)) {
                hasPreamble = true
                continue
            }
            if (topLevelDeclarationRegex.containsMatchIn(line)) {
                hasTopLevelDeclaration = true
                continue
            }
            return if (hasPreamble) SnippetKind.PREAMBLE_ONLY else SnippetKind.WRAPPED
        }
        return when {
            hasTopLevelDeclaration -> SnippetKind.FILE_LEVEL
            hasPreamble -> SnippetKind.PREAMBLE_ONLY
            else -> SnippetKind.WRAPPED
        }
    }

    private fun renderImports(imports: List<String>): List<String> {
        if (imports.isEmpty()) return emptyList()
        val seen = LinkedHashSet<String>()
        imports.map { it.trim() }
            .filter { it.isNotEmpty() }
            .forEach { raw ->
                val line = if (raw.startsWith("import ")) raw else "import $raw"
                seen.add(line)
            }
        return seen.toList()
    }

    private fun hasPackageDeclaration(code: String): Boolean {
        val lines = splitLinesPreserveTrailing(code)
        for (line in lines) {
            if (line.isBlank()) continue
            val trimmed = line.trimStart()
            if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                continue
            }
            if (line.first().isWhitespace()) {
                return false
            }
            if (line.startsWith("package ")) {
                return true
            }
            return false
        }
        return false
    }

    private enum class SnippetKind {
        FILE_LEVEL,
        WRAPPED,
        PREAMBLE_ONLY,
    }
}
