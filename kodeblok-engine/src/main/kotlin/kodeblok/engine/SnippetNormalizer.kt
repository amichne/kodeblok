package kodeblok.engine

private val inlineMarkerRegex = Regex("/\\*hover:id=([A-Za-z0-9_.-]+)\\*/")
private val caretMarkerRegex = Regex("//\\s*\\^\\s*hover:id=([A-Za-z0-9_.-]+)\\s*")

class SnippetNormalizer {
    fun normalize(source: SnippetSource): NormalizedSnippet {
        val normalizedRaw = normalizeLineEndings(source.rawCode)
        val lines = splitLinesPreserveTrailing(normalizedRaw)
        val markers = mutableListOf<MarkerAnchor>()
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
                markers.add(MarkerAnchor(id = id, kind = MarkerKind.CARET, line = lineNumber, col = caretColumn))
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
                    MarkerAnchor(
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

        if (markers.isNotEmpty()) {
            MarkerValidator().validate(markers, normalizedLines, source)
        }

        val normalized = normalizedLines.joinToString("\n")
        return NormalizedSnippet(
            snippetId = source.snippetId,
            code = normalized,
            origin = source.origin
        )
    }

    private data class MarkerAnchor(
        val id: String,
        val kind: MarkerKind,
        val line: Int,
        val col: Int,
    )

    private enum class MarkerKind {
        INLINE,
        CARET,
    }

    private class MarkerValidator {
        private val tokenRegex = Regex("`[^`]+`|[A-Za-z_][A-Za-z0-9_]*|\\d+(?:\\.\\d+)?")

        fun validate(
            markers: List<MarkerAnchor>,
            lines: List<String>,
            source: SnippetSource,
        ) {
            ensureUniqueMarkerIds(markers, source)
            markers.forEach { marker ->
                when (marker.kind) {
                    MarkerKind.INLINE -> locateInline(marker, lines, source)
                    MarkerKind.CARET -> locateCaret(marker, lines, source)
                }
            }
        }

        private fun ensureUniqueMarkerIds(
            markers: List<MarkerAnchor>,
            source: SnippetSource,
        ) {
            val seen = mutableSetOf<String>()
            markers.forEach { marker ->
                if (!seen.add(marker.id)) {
                    throw HoverEngineException(
                        "Duplicate hover marker id '${marker.id}' in ${source.origin.display()}"
                    )
                }
            }
        }

        private fun locateInline(
            marker: MarkerAnchor,
            lines: List<String>,
            source: SnippetSource,
        ) {
            val line = lineAt(lines, marker.line, source)
            val leftToken = findTokenBefore(line, marker.col)
            if (leftToken != null) {
                return
            }
            val rightToken = findTokenAfter(line, marker.col)
            if (rightToken != null) {
                return
            }
            throw HoverEngineException(
                "Inline marker ${marker.id} has no adjacent token in ${source.origin.display()} on line ${marker.line}"
            )
        }

        private fun locateCaret(
            marker: MarkerAnchor,
            lines: List<String>,
            source: SnippetSource,
        ) {
            val targetLineNumber = previousNonBlankLine(lines, marker.line - 1)
                ?: throw HoverEngineException(
                    "Caret marker ${marker.id} has no preceding code line in ${source.origin.display()}"
                )
            val targetLine = lineAt(lines, targetLineNumber, source)
            if (findTokenAt(targetLine, marker.col) == null) {
                throw HoverEngineException(
                    "Caret marker ${marker.id} does not point at a token in ${source.origin.display()} on line $targetLineNumber"
                )
            }
        }

        private fun lineAt(
            lines: List<String>,
            lineNumber: Int,
            source: SnippetSource,
        ): String {
            val index = lineNumber - 1
            if (index < 0 || index >= lines.size) {
                throw HoverEngineException("Marker line out of bounds in ${source.origin.display()} (line $lineNumber)")
            }
            return lines[index]
        }

        private fun previousNonBlankLine(
            lines: List<String>,
            start: Int,
        ): Int? {
            var index = start - 1
            while (index >= 0) {
                if (lines[index].isNotBlank()) {
                    return index + 1
                }
                index -= 1
            }
            return null
        }

        private fun findTokenAt(
            line: String,
            column: Int,
        ): TokenRange? {
            return tokenRegex.findAll(line).firstOrNull { match ->
                val startCol = match.range.first + 1
                val endCol = match.range.last + 1
                column in startCol..endCol
            }?.let { toTokenRange(it) }
        }

        private fun findTokenBefore(
            line: String,
            column: Int,
        ): TokenRange? {
            val index = (column - 1).coerceIn(0, line.length)
            val tokens = tokenRegex.findAll(line).toList()
            val candidate = tokens.lastOrNull { match -> match.range.last < index }
            if (candidate != null) {
                val gap = line.substring(candidate.range.last + 1, index)
                if (gap.all { it.isWhitespace() }) {
                    return toTokenRange(candidate)
                }
            }
            return null
        }

        private fun findTokenAfter(
            line: String,
            column: Int,
        ): TokenRange? {
            val index = (column - 1).coerceIn(0, line.length)
            val tokens = tokenRegex.findAll(line).toList()
            val candidate = tokens.firstOrNull { match -> match.range.first >= index }
            if (candidate != null) {
                val gap = line.substring(index, candidate.range.first)
                if (gap.all { it.isWhitespace() }) {
                    return toTokenRange(candidate)
                }
            }
            return null
        }

        private fun toTokenRange(match: MatchResult): TokenRange {
            return TokenRange(
                text = match.value,
                startCol = match.range.first + 1,
                endCol = match.range.last + 1
            )
        }

        private data class TokenRange(
            val text: String,
            val startCol: Int,
            val endCol: Int,
        )
    }
}
