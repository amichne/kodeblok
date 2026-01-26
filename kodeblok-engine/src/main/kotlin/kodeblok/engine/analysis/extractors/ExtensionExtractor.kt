package kodeblok.engine.analysis.extractors

import kodeblok.engine.analysis.AnalysisApiFacade
import kodeblok.schema.ExtensionData
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import org.jetbrains.kotlin.analysis.api.resolution.KaCallableMemberCall
import org.jetbrains.kotlin.analysis.api.resolution.KaFunctionCall
import org.jetbrains.kotlin.analysis.api.resolution.KaVariableAccessCall
import org.jetbrains.kotlin.analysis.api.resolution.calls
import org.jetbrains.kotlin.analysis.api.resolution.symbol
import org.jetbrains.kotlin.analysis.api.symbols.receiverType
import org.jetbrains.kotlin.psi.KtCallExpression
import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtNameReferenceExpression

class ExtensionExtractor(
    private val api: AnalysisApiFacade,
    private val level: InsightLevel,
) : InsightExtractor {
    override fun extract(element: KtElement): RawInsight? {
        if (level == InsightLevel.OFF) return null
        val (callSite, positionElement, tokenText) = when (element) {
            is KtCallExpression -> {
                val callee = element.calleeExpression ?: return null
                Triple(element, callee, callee.text)
            }
            is KtNameReferenceExpression -> Triple(element, element, element.text)
            else -> return null
        }
        val callInfo = api.resolveToCall(callSite) ?: return null
        val call = callInfo.calls.firstOrNull() as? KaCallableMemberCall<*, *> ?: return null
        if (!call.symbol.isExtension) return null

        val extensionReceiverType = call.partiallyAppliedSymbol.signature.receiverType
                                    ?: call.symbol.receiverType
                                    ?: return null
        val dispatchReceiverType = call.partiallyAppliedSymbol.dispatchReceiver?.type
        val name = call.symbol.nameOrUnknown()
        val resolvedFrom = call.symbol.callableId?.packageName?.asString() ?: "local"
        if (level == InsightLevel.HIGHLIGHTS) {
            val currentPackage = element.containingKtFile.packageFqName.asString()
            if (resolvedFrom == "local" || resolvedFrom == currentPackage) {
                return null
            }
        }
        val kind = when (call) {
            is KaFunctionCall<*> -> InsightKind.EXTENSION_FUNCTION_CALL
            is KaVariableAccessCall -> InsightKind.EXTENSION_PROPERTY_ACCESS
        }

        return RawInsight(
            position = positionElement.textRange,
            category = InsightCategory.EXTENSIONS,
            level = level,
            kind = kind,
            data = ExtensionData(
                functionOrProperty = name,
                extensionReceiverType = api.renderType(extensionReceiverType),
                dispatchReceiverType = dispatchReceiverType?.let { api.renderType(it) },
                resolvedFrom = resolvedFrom,
                competingMember = false
            ),
            tokenText = tokenText
        )
    }
}
