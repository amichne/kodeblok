package hovergen.gradle

import hovergen.engine.HoverEngine
import hovergen.engine.HoverEngineException
import hovergen.engine.HoverMapWriter
import hovergen.engine.SnippetExtractor
import hovergen.engine.analysis.AnalysisApiConfig
import hovergen.engine.analysis.AnalysisApiSemanticAnalyzer
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
        val analysisClasspath: ConfigurableFileCollection
    }

    override fun execute() {
        val analyzer = AnalysisApiSemanticAnalyzer(
            AnalysisApiConfig(parameters.analysisClasspath.files.map { it.toPath() })
        )
        val engine = HoverEngine(analyzer)
        val extractor = SnippetExtractor()
        val docsPath = parameters.docsDir.orNull?.asFile?.toPath()
        val snippetsPath = parameters.snippetsDir.orNull?.asFile?.toPath()
        val sources = extractor.extract(snippetsPath, docsPath, parameters.includeMdx.get())
        try {
            sources.forEach { source ->
                val hoverMap = engine.generateHoverMap(source, parameters.kotlinVersion.get())
                HoverMapWriter.write(hoverMap, parameters.outputDir.get().asFile.toPath())
            }
        } catch (exception: HoverEngineException) {
            throw GradleException(exception.message ?: "Hover map generation failed", exception)
        }
    }
}
