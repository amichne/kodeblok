package kodeblok.engine.analysis

import kodeblok.engine.WrapperKind
import kodeblok.schema.Range
import kodeblok.schema.ScopeKind
import kodeblok.schema.ScopeNode
import kodeblok.schema.ScopeRef
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtCatchClause
import org.jetbrains.kotlin.psi.KtClassOrObject
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtIfExpression
import org.jetbrains.kotlin.psi.KtLambdaExpression
import org.jetbrains.kotlin.psi.KtNamedFunction
import org.jetbrains.kotlin.psi.KtTryExpression
import org.jetbrains.kotlin.psi.KtWhenEntry

class ScopeTreeBuilder(
    private val mapper: TextRangeMapper,
    private val wrapperKind: WrapperKind,
    private val snippetRange: Range,
) {
    private var nextId = 0
    private val root = ScopeNodeBuilder(
        ref = ScopeRef(
            scopeId = nextScopeId(),
            kind = ScopeKind.FILE,
            receiverType = null,
            position = snippetRange
        )
    )
    private val stack = ArrayDeque<ScopeNodeBuilder>().apply { add(root) }

    fun enterIfScope(element: KtElement): ScopeNodeBuilder? {
        val kind = scopeKindFor(element) ?: return null
        val position = scopeRangeFor(element, kind) ?: return null
        val node = ScopeNodeBuilder(
            ref = ScopeRef(
                scopeId = nextScopeId(),
                kind = kind,
                receiverType = null,
                position = position
            )
        )
        stack.last().children.add(node)
        stack.addLast(node)
        return node
    }

    fun exit() {
        if (stack.size > 1) {
            stack.removeLast()
        }
    }

    fun currentChain(): List<ScopeRef> = stack.map { it.ref }

    fun registerInsight(id: String) {
        stack.last().insights.add(id)
    }

    fun rootScopes(): List<ScopeNode> = listOf(root.build())

    private fun scopeKindFor(element: KtElement): ScopeKind? = when (element) {
        is KtClassOrObject -> ScopeKind.CLASS
        is KtNamedFunction -> ScopeKind.FUNCTION
        is KtLambdaExpression -> ScopeKind.LAMBDA
        is KtWhenEntry -> ScopeKind.WHEN_BRANCH
        is KtIfExpression -> ScopeKind.IF_BRANCH
        is KtTryExpression -> ScopeKind.TRY_BLOCK
        is KtCatchClause -> ScopeKind.CATCH_BLOCK
        is KtCallExpression -> if (isScopeFunction(element)) ScopeKind.SCOPE_FUNCTION else null
        else -> null
    }

    private fun scopeRangeFor(element: KtElement, kind: ScopeKind): Range? {
        if (wrapperKind == WrapperKind.WRAPPED_FUNCTION && element is KtNamedFunction && element.name == "__snippet__") {
            return snippetRange
        }
        if (wrapperKind == WrapperKind.WRAPPED_FUNCTION && kind == ScopeKind.FILE) {
            return snippetRange
        }
        return mapper.toSnippetRange(element.textRange)
    }

    private fun nextScopeId(): String = "scope_${nextId++}"

    private fun isScopeFunction(call: KtCallExpression): Boolean {
        val callee = call.calleeExpression?.text ?: return false
        if (callee !in SCOPE_FUNCTIONS) return false
        return call.lambdaArguments.isNotEmpty() || call.valueArguments.any { arg ->
            val expression = arg.getArgumentExpression()
            expression is KtLambdaExpression
        }
    }

    data class ScopeNodeBuilder(
        val ref: ScopeRef,
        val children: MutableList<ScopeNodeBuilder> = mutableListOf(),
        val insights: MutableList<String> = mutableListOf(),
    ) {
        fun build(): ScopeNode = ScopeNode(
            ref = ref,
            children = children.map { it.build() },
            insights = insights.toList()
        )
    }

    private companion object {
        val SCOPE_FUNCTIONS = setOf("let", "run", "apply", "also", "with")
    }
}
