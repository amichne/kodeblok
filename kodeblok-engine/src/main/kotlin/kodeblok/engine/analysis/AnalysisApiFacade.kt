package kodeblok.engine.analysis

import org.jetbrains.kotlin.analysis.api.KaSession
import org.jetbrains.kotlin.analysis.api.resolution.KaCallCandidateInfo
import org.jetbrains.kotlin.analysis.api.resolution.KaCallInfo
import org.jetbrains.kotlin.analysis.api.symbols.symbol
import org.jetbrains.kotlin.analysis.api.types.KaType
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtExpression
import org.jetbrains.kotlin.psi.KtParameter
import org.jetbrains.kotlin.psi.KtProperty

class AnalysisApiFacade(private val session: KaSession) {
    private val renderer = TypeRenderer(session)

    fun expressionType(expression: KtExpression): KaType? = session.run { expression.expressionType }

    fun isMarkedNullable(type: KaType): Boolean = session.run { type.isMarkedNullable }

    fun resolveToCall(element: KtElement): KaCallInfo? = session.run { element.resolveToCall() }

    fun resolveToCallCandidates(element: KtElement): List<KaCallCandidateInfo> =
        session.run { element.resolveToCallCandidates() }

    fun renderType(type: KaType): String = renderer.render(type)

    fun propertyReturnType(property: KtProperty): KaType? = session.run { property.symbol.returnType }

    fun parameterReturnType(parameter: KtParameter): KaType? = session.run { parameter.symbol.returnType }
}
