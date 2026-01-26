package kodeblok.engine.analysis

import org.jetbrains.kotlin.analysis.api.KaExperimentalApi
import org.jetbrains.kotlin.analysis.api.KaSession
import org.jetbrains.kotlin.analysis.api.renderer.types.impl.KaTypeRendererForSource
import org.jetbrains.kotlin.analysis.api.types.KaType
import org.jetbrains.kotlin.analysis.utils.printer.PrettyPrinter

class TypeRenderer(private val session: KaSession) {
    @OptIn(KaExperimentalApi::class)
    private val renderer = KaTypeRendererForSource.WITH_QUALIFIED_NAMES

    @OptIn(KaExperimentalApi::class)
    fun render(type: KaType): String {
        val printer = PrettyPrinter()
        renderer.renderType(session, type, printer)
        return printer.toString()
    }
}
