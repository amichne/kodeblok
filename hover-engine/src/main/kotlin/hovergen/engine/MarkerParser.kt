package hovergen.engine

private val inlineMarkerRegex = Regex("/\\*hover:id=([A-Za-z0-9_.-]+)\\*/")
private val caretMarkerRegex = Regex("//\\s*\\^\\s*hover:id=([A-Za-z0-9_.-]+)\\s*")

class MarkerParser {
    fun parse(source: SnippetSource): NormalizedSnippet {
        val normalizedRaw = normalizeLineEndings(source.rawCode)
        val lines = normalizedRaw.split("\n", ignoreCase = false, limit = -1)
        val markers = mutableListOf<HoverMarker>()
        val normalizedLines = lines.mapIndexed { index, line ->
            val lineNumber = index + 1
            val caretMatch = caretMarkerRegex.find(line)
            if (caretMatch != null && line.trimStart().startsWith("//")) {
                val caretColumn = line.indexOf('^') + 1
                if (caretColumn <= 0) {
                    throw HoverEngineException(
                        "Malformed caret marker in ${source.origin.display()} on line $lineNumber"
                    )
                }
                val id = caretMatch.groupValues[1]
                markers.add(HoverMarker(id = id, kind = MarkerKind.CARET, line = lineNumber, col = caretColumn))
                return@mapIndexed " ".repeat(line.length)
            }

            val matches = inlineMarkerRegex.findAll(line).toList()
            if (matches.isEmpty()) {
                return@mapIndexed line
            }

            val builder = StringBuilder(line)
            matches.asReversed().forEach { match ->
                val id = match.groupValues[1]
                val start = match.range.first
                val length = match.value.length
                markers.add(
                    HoverMarker(
                        id = id,
                        kind = MarkerKind.INLINE,
                        line = lineNumber,
                        col = start + 1
                    )
                )
                repeat(length) { offset ->
                    builder.setCharAt(start + offset, ' ')
                }
            }
            builder.toString()
        }

        val normalized = normalizedLines.joinToString("\n")
        val sortedMarkers = markers.sortedWith(compareBy({ it.line }, { it.col }, { it.id }))
        return NormalizedSnippet(
            snippetId = source.snippetId,
            code = normalized,
            markers = sortedMarkers,
            origin = source.origin
        )
    }

    private fun normalizeLineEndings(input: String): String =
        input.replace("\r\n", "\n").replace('\r', '\n')
}
