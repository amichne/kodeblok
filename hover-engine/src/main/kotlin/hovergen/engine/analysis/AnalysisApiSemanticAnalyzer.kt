package hovergen.engine.analysis

import com.intellij.psi.PsiElement
import hovergen.engine.HoverEngineException
import hovergen.engine.HoverTarget
import hovergen.engine.NormalizedSnippet
import hovergen.engine.SemanticAnalyzer
import hovergen.engine.WrappedSnippet
import hovergen.engine.normalizeLineEndings
import hovergen.schema.HoverMeta
import hovergen.schema.ReasonKind
import org.jetbrains.kotlin.analysis.api.KaExperimentalApi
import org.jetbrains.kotlin.analysis.api.analyze
import org.jetbrains.kotlin.analysis.api.renderer.types.impl.KaTypeRendererForSource
import org.jetbrains.kotlin.analysis.utils.printer.PrettyPrinter
import org.jetbrains.kotlin.psi.KtExpression
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.psi.KtQualifiedExpression

@OptIn(KaExperimentalApi::class)
class AnalysisApiSemanticAnalyzer(
    private val config: AnalysisApiConfig,
) : SemanticAnalyzer {
    private val typeRenderer = KaTypeRendererForSource.WITH_QUALIFIED_NAMES

    override fun analyze(
        snippet: NormalizedSnippet,
        wrapped: WrappedSnippet,
        targets: List<HoverTarget>,
        kotlinVersion: String,
    ): Map<String, HoverMeta> {
        config.validate(snippet.origin)
        AnalysisApiEnvironment.create(wrapped.code, config, kotlinVersion).use { environment ->
            return analyze(environment.ktFile) {
                targets.associate { target ->
                    val expression = findExpression(
                        environment.ktFile,
                        wrapped,
                        target
                    )
                    val qualified = findQualifiedSelector(expression)
                    val expressionType = (qualified ?: expression).expressionType
                    val receiverType = qualified?.receiverExpression?.expressionType
                    val meta = HoverMeta(
                        exprType = expressionType?.let { renderType(this, it) },
                        receiverType = receiverType?.let { renderType(this, it) },
                        reasonKind = ReasonKind.UNKNOWN
                    )
                    target.id to meta
                }
            }
        }
    }

    private fun findExpression(
        ktFile: KtFile,
        wrapped: WrappedSnippet,
        target: HoverTarget,
    ): KtExpression {
        val wrapperLine = wrapped.lineMap.snippetToWrapperLine(target.range.from.line)
        val offset = offsetForLineCol(ktFile.text, wrapperLine, target.range.from.col)
        val element = ktFile.findElementAt(offset)
                      ?: throw HoverEngineException("Hover target ${target.id} has no PSI element at offset")
        return findParentExpression(element)
               ?: throw HoverEngineException("Hover target ${target.id} is not part of a Kotlin expression")
    }

    private fun findQualifiedSelector(expression: KtExpression): KtQualifiedExpression? {
        var current: PsiElement? = expression.parent
        while (current != null) {
            if (current is KtQualifiedExpression) {
                val selector = current.selectorExpression ?: return null
                return if (selector.textRange.contains(expression.textRange)) current else null
            }
            current = current.parent
        }
        return null
    }

    private fun renderType(
        session: org.jetbrains.kotlin.analysis.api.KaSession,
        type: org.jetbrains.kotlin.analysis.api.types.KaType,
    ): String {
        val printer = PrettyPrinter()
        typeRenderer.renderType(session, type, printer)
        return printer.toString()
    }

    private fun findParentExpression(element: PsiElement): KtExpression? {
        var current: PsiElement? = element
        while (current != null) {
            if (current is KtExpression) {
                return current
            }
            current = current.parent
        }
        return null
    }

    private fun offsetForLineCol(
        text: String,
        line: Int,
        col: Int,
    ): Int {
        if (line < 1 || col < 1) {
            throw HoverEngineException("Invalid position line=$line col=$col")
        }
        val normalized = normalizeLineEndings(text)
        var index = 0
        var currentLine = 1
        while (currentLine < line && index < normalized.length) {
            if (normalized[index] == '\n') {
                currentLine += 1
            }
            index += 1
        }
        if (currentLine != line) {
            throw HoverEngineException("Line $line is out of bounds in wrapped snippet")
        }
        val lineStart = index
        val lineEnd = normalized.indexOf('\n', lineStart).let { if (it == -1) normalized.length else it }
        val offset = lineStart + col - 1
        if (offset > lineEnd) {
            throw HoverEngineException("Column $col is out of bounds on line $line")
        }
        return offset
    }
}
