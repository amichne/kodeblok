package kodeblok.engine.analysis

import kodeblok.engine.ENGINE_KOTLIN_VERSION
import kodeblok.engine.Hashing
import kodeblok.schema.InsightCategory
import kodeblok.schema.InsightLevel
import kodeblok.schema.SemanticProfile

interface EagerSemanticAnalyzer {
    fun analyze(
        code: String,
        config: AnalysisConfig = AnalysisConfig(),
        kotlinVersion: String = ENGINE_KOTLIN_VERSION,
    ): SemanticProfile
}

class NoOpEagerSemanticAnalyzer : EagerSemanticAnalyzer {
    override fun analyze(
        code: String,
        config: AnalysisConfig,
        kotlinVersion: String,
    ): SemanticProfile {
        return SemanticProfile(
            snippetId = "inline",
            codeHash = Hashing.sha256Hex(code),
            code = code,
            insights = emptyList(),
            rootScopes = emptyList()
        )
    }
}

data class AnalysisConfig(
    val levels: Map<InsightCategory, InsightLevel> = defaults(),
) {
    fun levelFor(category: InsightCategory): InsightLevel =
        levels[category] ?: InsightLevel.OFF

    companion object {
        fun defaults(): Map<InsightCategory, InsightLevel> =
            InsightCategory.entries.associateWith { InsightLevel.HIGHLIGHTS }

        fun all(): Map<InsightCategory, InsightLevel> =
            InsightCategory.entries.associateWith { InsightLevel.ALL }

        fun minimal(): Map<InsightCategory, InsightLevel> =
            InsightCategory.entries.associateWith { InsightLevel.OFF }
    }
}
