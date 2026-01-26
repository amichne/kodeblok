package kodeblok.engine

import kodeblok.schema.HoverMeta
import kodeblok.schema.ReasonKind

object KodeblokRenderer {
    fun renderBody(
        tokenText: String,
        meta: HoverMeta?,
    ): String {
        if (meta == null) {
            return "Symbol: `${escapeInline(tokenText)}`\n\n_No semantic info available._"
        }
        val lines = mutableListOf<String>()
        val exprType = meta.exprType
        if (exprType != null) {
            lines.add("**Type:** `${escapeInline(exprType)}`")
        }
        val receiverType = meta.receiverType
        if (receiverType != null) {
            lines.add("**Receiver:** `${escapeInline(receiverType)}`")
        }
        val declaredType = meta.declaredType
        if (declaredType != null && declaredType != exprType) {
            lines.add("**Declared:** `${escapeInline(declaredType)}`")
        }
        if (meta.reasonKind != ReasonKind.UNKNOWN) {
            lines.add("_Reason: ${meta.reasonKind.name}_")
        }
        if (lines.isEmpty()) {
            return "Symbol: `${escapeInline(tokenText)}`\n\n_No semantic info available._"
        }
        return lines.joinToString("\n")
    }

    private fun escapeInline(text: String): String = text.replace("`", "\\`")
}
