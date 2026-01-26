package kodeblok.engine.analysis.extractors

import kodeblok.engine.ENGINE_KOTLIN_VERSION
import kodeblok.engine.analysis.AnalysisApiConfig
import kodeblok.engine.analysis.AnalysisApiEagerAnalyzer
import kodeblok.engine.analysis.AnalysisConfig
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightKind
import kodeblok.schema.InsightLevel
import kodeblok.schema.SemanticInsight
import kodeblok.schema.SemanticProfile
import java.io.File
import java.nio.file.Path
import kotlin.test.assertTrue

internal fun analyzeSnippet(
    code: String,
    config: AnalysisConfig = AnalysisConfig(levels = AnalysisConfig.all()),
): SemanticProfile {
    val classpath = System.getProperty("kodeblok.classpath")
        ?.split(File.pathSeparator)
        ?.filter { it.isNotBlank() }
        ?.map { Path.of(it) }
        ?: error("Missing kodeblok.classpath")
    val analyzer = AnalysisApiEagerAnalyzer(
        AnalysisApiConfig(classpath = classpath)
    )
    return analyzer.analyze(code, config, ENGINE_KOTLIN_VERSION)
}

internal fun configWith(vararg entries: Pair<InsightCategory, InsightLevel>): AnalysisConfig {
    val levels = AnalysisConfig.minimal().toMutableMap()
    entries.forEach { (category, level) ->
        levels[category] = level
    }
    return AnalysisConfig(levels = levels)
}

internal fun SemanticProfile.findInsight(
    category: InsightCategory,
    kind: InsightKind,
    tokenText: String? = null,
): SemanticInsight {
    val matches = insights.filter { insight ->
        insight.category == category && insight.kind == kind && (tokenText == null || insight.tokenText == tokenText)
    }
    assertTrue(
        matches.isNotEmpty(),
        "Expected insight for category=$category kind=$kind tokenText=${tokenText ?: "<any>"}."
    )
    return matches.first()
}

internal fun SemanticProfile.assertNoInsights(category: InsightCategory) {
    assertTrue(
        insights.none { insight -> insight.category == category },
        "Expected no insights for category=$category"
    )
}
