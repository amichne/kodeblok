package kodeblok.engine

const val ENGINE_KOTLIN_VERSION = "2.3.0"

data class SnippetSource(
    val snippetId: String,
    val rawCode: String,
    val origin: OriginLocation,
)

data class OriginLocation(
    val path: String,
    val line: Int,
    val col: Int,
) {
    fun display(): String = "$path:$line:$col"
}

data class NormalizedSnippet(
    val snippetId: String,
    val code: String,
    val origin: OriginLocation,
)

data class WrappedSnippet(
    val code: String,
    val lineMap: LineMap,
    val kind: WrapperKind,
)

enum class WrapperKind {
    FILE_LEVEL,
    WRAPPED_FUNCTION,
}

data class LineMap(
    val lineOffset: Int,
) {
    fun snippetToWrapperLine(line: Int): Int = line + lineOffset
    fun wrapperToSnippetLine(line: Int): Int = line - lineOffset
}
