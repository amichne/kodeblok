package kodeblok.engine.analysis

object SemanticAnalyzerFactory {
    fun create(analysisConfig: AnalysisApiConfig): EagerSemanticAnalyzer =
        AnalysisApiEagerAnalyzer(analysisConfig)
}
