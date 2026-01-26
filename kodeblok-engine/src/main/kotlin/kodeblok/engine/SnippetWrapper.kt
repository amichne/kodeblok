package kodeblok.engine

private val topLevelDeclarationRegex = Regex("^(fun|class|object|interface|typealias|val|var|package|import)\\b")

class SnippetWrapper {
    fun wrap(snippet: NormalizedSnippet): WrappedSnippet {
        if (shouldTreatAsFileLevel(snippet.code)) {
            return WrappedSnippet(
                code = snippet.code,
                lineMap = LineMap(lineOffset = 0),
                kind = WrapperKind.FILE_LEVEL
            )
        }

        val builder = StringBuilder()
        builder.append("package kodeblok\n")
        builder.append("fun __snippet__() {\n")
        builder.append(snippet.code)
        if (!snippet.code.endsWith("\n")) {
            builder.append("\n")
        }
        builder.append("}\n")

        return WrappedSnippet(
            code = builder.toString(),
            lineMap = LineMap(lineOffset = 2),
            kind = WrapperKind.WRAPPED_FUNCTION
        )
    }

    private fun shouldTreatAsFileLevel(code: String): Boolean {
        val lines = splitLinesPreserveTrailing(code)
        var hasTopLevelDeclaration = false
        for (line in lines) {
            if (line.isBlank()) continue
            val trimmed = line.trimStart()
            if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
                continue
            }
            if (line.first().isWhitespace()) {
                continue
            }
            if (topLevelDeclarationRegex.containsMatchIn(line)) {
                hasTopLevelDeclaration = true
                continue
            }
            return false
        }
        return hasTopLevelDeclaration
    }
}
