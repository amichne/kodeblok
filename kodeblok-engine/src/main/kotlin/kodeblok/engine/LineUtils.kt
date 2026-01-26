package kodeblok.engine

fun normalizeLineEndings(input: String): String =
    input.replace("\r\n", "\n").replace('\r', '\n')

fun splitLinesPreserveTrailing(input: String): List<String> {
    val normalized = normalizeLineEndings(input)
    val lines = normalized.split("\n")
    val trailingCount = countTrailingNewlines(normalized)
    return if (trailingCount == 0) {
        lines
    } else {
        lines + List(trailingCount) { "" }
    }
}

private fun countTrailingNewlines(input: String): Int {
    var count = 0
    var index = input.length - 1
    while (index >= 0 && input[index] == '\n') {
        count += 1
        index -= 1
    }
    return count
}
