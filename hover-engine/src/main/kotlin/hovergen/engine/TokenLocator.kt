package hovergen.engine

import hovergen.schema.Position
import hovergen.schema.Range

private val tokenRegex = Regex("`[^`]+`|[A-Za-z_][A-Za-z0-9_]*|\\d+(?:\\.\\d+)?")

class TokenLocator {
    fun locateTargets(snippet: NormalizedSnippet): List<HoverTarget> {
        val lines = splitLinesPreserveTrailing(snippet.code)
        return snippet.markers.map { marker ->
            when (marker.kind) {
                MarkerKind.INLINE -> locateInline(marker, lines, snippet)
                MarkerKind.CARET -> locateCaret(marker, lines, snippet)
            }
        }
    }

    private fun locateInline(marker: HoverMarker, lines: List<String>, snippet: NormalizedSnippet): HoverTarget {
        val line = lineAt(lines, marker.line, snippet)
        val leftToken = findTokenBefore(line, marker.col)
        if (leftToken != null) {
            return buildTarget(marker.id, marker.line, leftToken)
        }
        val rightToken = findTokenAfter(line, marker.col)
        if (rightToken != null) {
            return buildTarget(marker.id, marker.line, rightToken)
        }
        throw HoverEngineException("Inline marker ${marker.id} has no adjacent token in ${snippet.origin.display()} on line ${marker.line}")
    }

    private fun locateCaret(marker: HoverMarker, lines: List<String>, snippet: NormalizedSnippet): HoverTarget {
        val targetLineNumber = previousNonBlankLine(lines, marker.line - 1)
            ?: throw HoverEngineException(
                "Caret marker ${marker.id} has no preceding code line in ${snippet.origin.display()}"
            )
        val targetLine = lineAt(lines, targetLineNumber, snippet)
        val token = findTokenAt(targetLine, marker.col)
            ?: throw HoverEngineException(
                "Caret marker ${marker.id} does not point at a token in ${snippet.origin.display()} on line $targetLineNumber"
            )
        return buildTarget(marker.id, targetLineNumber, token)
    }

    private fun buildTarget(id: String, lineNumber: Int, token: TokenRange): HoverTarget {
        val from = Position(line = lineNumber, col = token.startCol)
        val to = Position(line = lineNumber, col = token.endCol)
        return HoverTarget(id = id, range = Range(from = from, to = to), tokenText = token.text)
    }

    private fun lineAt(lines: List<String>, lineNumber: Int, snippet: NormalizedSnippet): String {
        val index = lineNumber - 1
        if (index < 0 || index >= lines.size) {
            throw HoverEngineException("Marker line out of bounds in ${snippet.origin.display()} (line $lineNumber)")
        }
        return lines[index]
    }

    private fun previousNonBlankLine(lines: List<String>, start: Int): Int? {
        var index = start - 1
        while (index >= 0) {
            if (lines[index].isNotBlank()) {
                return index + 1
            }
            index -= 1
        }
        return null
    }

    private fun findTokenAt(line: String, column: Int): TokenRange? {
        return tokenRegex.findAll(line).firstOrNull { match ->
            val startCol = match.range.first + 1
            val endCol = match.range.last + 1
            column in startCol..endCol
        }?.let { toTokenRange(line, it) }
    }

    private fun findTokenBefore(line: String, column: Int): TokenRange? {
        val index = (column - 1).coerceIn(0, line.length)
        val tokens = tokenRegex.findAll(line).toList()
        val candidate = tokens.lastOrNull { match -> match.range.last < index }
        if (candidate != null) {
            val gap = line.substring(candidate.range.last + 1, index)
            if (gap.all { it.isWhitespace() }) {
                return toTokenRange(line, candidate)
            }
        }
        return null
    }

    private fun findTokenAfter(line: String, column: Int): TokenRange? {
        val index = (column - 1).coerceIn(0, line.length)
        val tokens = tokenRegex.findAll(line).toList()
        val candidate = tokens.firstOrNull { match -> match.range.first >= index }
        if (candidate != null) {
            val gap = line.substring(index, candidate.range.first)
            if (gap.all { it.isWhitespace() }) {
                return toTokenRange(line, candidate)
            }
        }
        return null
    }

    private fun toTokenRange(line: String, match: MatchResult): TokenRange {
        return TokenRange(
            text = match.value,
            startCol = match.range.first + 1,
            endCol = match.range.last + 1
        )
    }

    private data class TokenRange(
        val text: String,
        val startCol: Int,
        val endCol: Int
    )
}
