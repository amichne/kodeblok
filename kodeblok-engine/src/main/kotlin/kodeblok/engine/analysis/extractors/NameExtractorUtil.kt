package kodeblok.engine.analysis.extractors

import org.jetbrains.kotlin.analysis.api.signatures.KaCallableSignature
import org.jetbrains.kotlin.analysis.api.symbols.KaCallableSymbol
import org.jetbrains.kotlin.analysis.api.symbols.name

fun KaCallableSignature<*>.nameOrUnknown(): String = callableId?.asSingleFqName()?.asString()
                                                     ?: symbol.nameOrUnknown()

fun KaCallableSymbol.nameOrUnknown(): String = callableId?.asSingleFqName()?.asString()
                                               ?: name?.asStringStripSpecialMarkers()
                                               ?: "<unknown>"
