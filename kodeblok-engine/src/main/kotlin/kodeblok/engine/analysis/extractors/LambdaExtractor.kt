package kodeblok.engine.analysis.extractors

import kodeblok.engine.analysis.AnalysisApiFacade
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.LambdaData
import kodeblok.schema.LambdaParam
import org.jetbrains.kotlin.analysis.api.types.KaFunctionType
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtLambdaExpression

class LambdaExtractor(
    private val api: AnalysisApiFacade,
    private val level: InsightLevel,
) : InsightExtractor {
    override fun extract(element: KtElement): RawInsight? {
        if (level == InsightLevel.OFF) return null
        if (element !is KtLambdaExpression) return null

        val functionType = api.expressionType(element) as? KaFunctionType ?: return null
        val params = element.functionLiteral.valueParameters
        val parameterTypes = functionType.parameterTypes.mapIndexed { index, type ->
            val name = params.getOrNull(index)?.name ?: if (params.isEmpty() && functionType.parameterTypes.size == 1) "it" else null
            LambdaParam(name = name, type = api.renderType(type))
        }
        val returnType = api.renderType(functionType.returnType)

        val inferredParams = params.any { it.typeReference == null } || (params.isEmpty() && parameterTypes.isNotEmpty())
        if (level == InsightLevel.HIGHLIGHTS && !inferredParams && parameterTypes.size <= 1) {
            return null
        }

        val kind = if (inferredParams) InsightKind.LAMBDA_PARAMETER_INFERRED else InsightKind.LAMBDA_RETURN_INFERRED
        return RawInsight(
            position = element.textRange,
            category = InsightCategory.LAMBDAS,
            level = level,
            kind = kind,
            data = LambdaData(
                parameterTypes = parameterTypes,
                returnType = returnType,
                inferredFromContext = null,
                samInterface = null
            ),
            tokenText = element.text
        )
    }
}
