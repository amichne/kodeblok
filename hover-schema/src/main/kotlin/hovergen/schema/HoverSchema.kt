package hovergen.schema

const val SCHEMA_VERSION: Int = 1

data class HoverMap(
    val schemaVersion: Int = SCHEMA_VERSION,
    val snippetId: String,
    val codeHash: String,
    val language: String = "kotlin",
    val code: String,
    val hovers: List<HoverEntry>,
)

data class HoverEntry(
    val id: String,
    val from: Position,
    val to: Position,
    val title: String? = null,
    val body: String,
    val meta: HoverMeta? = null,
)

data class Position(
    val line: Int,
    val col: Int,
)

data class HoverMeta(
    val exprType: String? = null,
    val declaredType: String? = null,
    val receiverType: String? = null,
    val reasonKind: ReasonKind = ReasonKind.UNKNOWN,
    val evidence: Range? = null,
)

enum class ReasonKind {
    IS_CHECK,
    NEGATED_IS_CHECK_WITH_EXIT,
    WHEN_IS_BRANCH,
    EXPLICIT_CAST,
    UNKNOWN
}

data class Range(
    val from: Position,
    val to: Position,
)

object HoverMapJsonWriter {
    fun toJson(map: HoverMap): String {
        val builder = StringBuilder()
        appendHoverMap(builder, map)
        return builder.toString()
    }

    private fun appendHoverMap(
        builder: StringBuilder,
        map: HoverMap,
    ) {
        builder.append('{')
        builder.append("\"schemaVersion\":").append(map.schemaVersion).append(',')
        builder.append("\"snippetId\":").appendQuoted(map.snippetId).append(',')
        builder.append("\"codeHash\":").appendQuoted(map.codeHash).append(',')
        builder.append("\"language\":").appendQuoted(map.language).append(',')
        builder.append("\"code\":").appendQuoted(map.code).append(',')
        builder.append("\"hovers\":[")
        map.hovers.forEachIndexed { index, hover ->
            if (index > 0) builder.append(',')
            appendHoverEntry(builder, hover)
        }
        builder.append(']')
        builder.append('}')
    }

    private fun appendHoverEntry(
        builder: StringBuilder,
        hover: HoverEntry,
    ) {
        builder.append('{')
        builder.append("\"id\":").appendQuoted(hover.id).append(',')
        builder.append("\"from\":")
        appendPosition(builder, hover.from)
        builder.append(',')
        builder.append("\"to\":")
        appendPosition(builder, hover.to)
        if (hover.title != null) {
            builder.append(',').append("\"title\":").appendQuoted(hover.title)
        }
        builder.append(',').append("\"body\":").appendQuoted(hover.body)
        if (hover.meta != null) {
            builder.append(',').append("\"meta\":")
            appendMeta(builder, hover.meta)
        }
        builder.append('}')
    }

    private fun appendPosition(
        builder: StringBuilder,
        position: Position,
    ) {
        builder.append('{')
        builder.append("\"line\":").append(position.line).append(',')
        builder.append("\"col\":").append(position.col)
        builder.append('}')
    }

    private fun appendMeta(
        builder: StringBuilder,
        meta: HoverMeta,
    ) {
        builder.append('{')
        var needsComma = false
        if (meta.exprType != null) {
            builder.append("\"exprType\":").appendQuoted(meta.exprType)
            needsComma = true
        }
        if (meta.declaredType != null) {
            if (needsComma) builder.append(',')
            builder.append("\"declaredType\":").appendQuoted(meta.declaredType)
            needsComma = true
        }
        if (meta.receiverType != null) {
            if (needsComma) builder.append(',')
            builder.append("\"receiverType\":").appendQuoted(meta.receiverType)
            needsComma = true
        }
        if (needsComma) builder.append(',')
        builder.append("\"reasonKind\":").appendQuoted(meta.reasonKind.name)
        if (meta.evidence != null) {
            builder.append(',').append("\"evidence\":")
            appendRange(builder, meta.evidence)
        }
        builder.append('}')
    }

    private fun appendRange(
        builder: StringBuilder,
        range: Range,
    ) {
        builder.append('{')
        builder.append("\"from\":")
        appendPosition(builder, range.from)
        builder.append(',')
        builder.append("\"to\":")
        appendPosition(builder, range.to)
        builder.append('}')
    }

    private fun StringBuilder.appendQuoted(value: String): StringBuilder {
        append('"')
        value.forEach { ch ->
            when (ch) {
                '\\' -> append("\\\\")
                '"' -> append("\\\"")
                '\n' -> append("\\n")
                '\r' -> append("\\r")
                '\t' -> append("\\t")
                else -> append(ch)
            }
        }
        append('"')
        return this
    }
}
