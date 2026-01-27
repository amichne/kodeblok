package kodeblok.engine.analysis

import kodeblok.engine.LineMap
import kodeblok.engine.normalizeLineEndings
import kodeblok.schema.Position
import kodeblok.schema.Range
import com.intellij.openapi.util.TextRange
import kotlin.math.max

class TextRangeMapper(
    wrappedCode: String,
    private val lineMap: LineMap,
    private val snippetRange: Range,
) {
    private val normalizedCode = normalizeLineEndings(wrappedCode)
    private val lineStarts: IntArray = buildLineStarts(normalizedCode)
    private val maxSnippetLine = snippetRange.to.line

    fun toSnippetRange(textRange: TextRange): Range? {
        val from = toSnippetPosition(textRange.startOffset) ?: return null
        val endOffset = if (textRange.endOffset > textRange.startOffset) {
            textRange.endOffset - 1
        } else {
            textRange.startOffset
        }
        val to = toSnippetPosition(max(endOffset, textRange.startOffset)) ?: return null
        return Range(from = from, to = to)
    }

    fun toSnippetPosition(offset: Int): Position? {
        if (offset < 0 || offset > normalizedCode.length) {
            return null
        }
        val lineIndex = findLineIndex(offset)
        val wrapperLine = lineIndex + 1
        val snippetLine = lineMap.wrapperToSnippetLine(wrapperLine)
        if (snippetLine < 1 || snippetLine > maxSnippetLine) {
            return null
        }
        val col = offset - lineStarts[lineIndex] + 1
        return Position(line = snippetLine, col = col)
    }

    private fun findLineIndex(offset: Int): Int {
        var low = 0
        var high = lineStarts.size - 1
        while (low <= high) {
            val mid = (low + high) ushr 1
            val start = lineStarts[mid]
            val nextStart = if (mid + 1 < lineStarts.size) lineStarts[mid + 1] else normalizedCode.length + 1
            if (offset < start) {
                high = mid - 1
            } else if (offset >= nextStart) {
                low = mid + 1
            } else {
                return mid
            }
        }
        return max(0, lineStarts.size - 1)
    }

    private fun buildLineStarts(text: String): IntArray {
        val starts = ArrayList<Int>(64)
        starts.add(0)
        text.forEachIndexed { index, ch ->
            if (ch == '\n') {
                starts.add(index + 1)
            }
        }
        return starts.toIntArray()
    }
}
