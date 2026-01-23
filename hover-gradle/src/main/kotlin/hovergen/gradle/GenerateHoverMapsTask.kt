package hovergen.gradle

import hovergen.engine.HoverEngine
import hovergen.engine.HoverEngineException
import hovergen.engine.HoverMapWriter
import hovergen.engine.SnippetExtractor
import hovergen.engine.analysis.AnalysisApiConfig
import hovergen.engine.analysis.AnalysisApiSemanticAnalyzer
import org.gradle.api.DefaultTask
import org.gradle.api.GradleException
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Classpath
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputDirectory
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction

abstract class GenerateHoverMapsTask : DefaultTask() {
    @get:InputDirectory
    @get:Optional
    abstract val docsDir: DirectoryProperty

    @get:InputDirectory
    @get:Optional
    abstract val snippetsDir: DirectoryProperty

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Input
    abstract val includeMdx: Property<Boolean>

    @get:Input
    abstract val kotlinVersion: Property<String>

    @get:Classpath
    abstract val classpath: ConfigurableFileCollection

    @TaskAction
    fun generate() {
        val analyzer = AnalysisApiSemanticAnalyzer(
            AnalysisApiConfig(classpath.files.map { it.toPath() })
        )
        val engine = HoverEngine(analyzer)
        val extractor = SnippetExtractor()
        val docsPath = docsDir.orNull?.asFile?.toPath()
        val snippetsPath = snippetsDir.orNull?.asFile?.toPath()
        val sources = extractor.extract(snippetsPath, docsPath, includeMdx.get())
        try {
            sources.forEach { source ->
                val hoverMap = engine.generateHoverMap(source, kotlinVersion.get())
                HoverMapWriter.write(hoverMap, outputDir.get().asFile.toPath())
            }
        } catch (exception: HoverEngineException) {
            throw GradleException(exception.message ?: "Hover map generation failed", exception)
        }
    }
}
