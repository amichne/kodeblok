package hovergen.engine

private val topLevelDeclarationRegex = Regex("(?m)^(fun|class|object|interface|typealias|val|var)\\b")

class SnippetWrapper {
    fun wrap(snippet: NormalizedSnippet): WrappedSnippet {
        if (topLevelDeclarationRegex.containsMatchIn(snippet.code)) {
            return WrappedSnippet(
                code = snippet.code,
                lineMap = LineMap(lineOffset = 0),
                kind = WrapperKind.FILE_LEVEL
            )
        }

        val builder = StringBuilder()
        builder.append("package hovergen\n")
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
}
