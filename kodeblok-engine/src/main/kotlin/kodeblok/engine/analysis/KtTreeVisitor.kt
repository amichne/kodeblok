package kodeblok.engine.analysis

import org.jetbrains.kotlin.psi.KtElement
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.psi.KtVisitorVoid

class KtTreeVisitor(
    private val collector: InsightCollector,
    private val scopeBuilder: ScopeTreeBuilder,
) : KtVisitorVoid() {
    override fun visitKtFile(file: KtFile) {
        visitKtElement(file)
    }

    override fun visitKtElement(element: KtElement) {
        val scopeChange = scopeBuilder.enterIfScope(element)
        collector.examine(element)
        element.acceptChildren(this)
        scopeChange?.let { scopeBuilder.exit() }
    }
}
