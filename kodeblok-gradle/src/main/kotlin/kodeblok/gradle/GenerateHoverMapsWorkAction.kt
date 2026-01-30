package kodeblok.gradle

import kodeblok.engine.KodeblokEngine
import kodeblok.engine.HoverEngineException
import kodeblok.engine.KodeblokMapWriter
import kodeblok.engine.SnippetExtractor
import kodeblok.engine.analysis.AnalysisConfig
import kodeblok.engine.analysis.AnalysisApiConfig
import kodeblok.engine.analysis.AnalysisApiEagerAnalyzer
import kodeblok.schema.InsightLevel
import org.gradle.api.GradleException
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.Property
import org.gradle.workers.WorkAction
import org.gradle.workers.WorkParameters

abstract class GenerateHoverMapsWorkAction : WorkAction<GenerateHoverMapsWorkAction.Parameters> {
    interface Parameters : WorkParameters {
        val docsDir: DirectoryProperty
        val snippetsDir: DirectoryProperty
        val outputDir: DirectoryProperty
        val includeMdx: Property<Boolean>
        val kotlinVersion: Property<String>
        val analysisLevel: Property<InsightLevel>
        val analysisClasspath: ConfigurableFileCollection
    }

    override fun execute() {
        val analyzer = AnalysisApiEagerAnalyzer(
            AnalysisApiConfig(parameters.analysisClasspath.files.map { it.toPath() })
        )
        val engine = KodeblokEngine(analyzer)
        val extractor = SnippetExtractor()
        val docsPath = parameters.docsDir.orNull?.asFile?.toPath()
        val snippetsPath = parameters.snippetsDir.orNull?.asFile?.toPath()
        val sources = extractor.extract(snippetsPath, docsPath, parameters.includeMdx.get())
        val analysisConfig = when (parameters.analysisLevel.get()) {
            InsightLevel.ALL -> AnalysisConfig(AnalysisConfig.all())
            InsightLevel.OFF -> AnalysisConfig(AnalysisConfig.minimal())
            InsightLevel.HIGHLIGHTS -> AnalysisConfig()
        }
        try {
            sources.forEach { source ->
                val profile = engine.generateSemanticProfile(
                    source,
                    parameters.kotlinVersion.get(),
                    analysisConfig
                )
                KodeblokMapWriter.write(profile, parameters.outputDir.get().asFile.toPath())
            }
        } catch (exception: HoverEngineException) {
            throw GradleException(exception.message ?: "Hover map generation failed", exception)
        }
    }
}
