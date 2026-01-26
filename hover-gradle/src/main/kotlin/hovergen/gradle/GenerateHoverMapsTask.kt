package hovergen.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.provider.Property
import org.gradle.api.tasks.Classpath
import org.gradle.api.tasks.Input
import org.gradle.api.tasks.InputDirectory
import org.gradle.api.tasks.Optional
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction
import org.gradle.workers.WorkerExecutor
import javax.inject.Inject

abstract class GenerateHoverMapsTask @Inject constructor(
    private val workerExecutor: WorkerExecutor,
) : DefaultTask() {
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
    abstract val analysisClasspath: ConfigurableFileCollection

    @get:Classpath
    abstract val workerClasspath: ConfigurableFileCollection

    @TaskAction
    fun generate() {
        val queue = workerExecutor.processIsolation {
            it.classpath.from(workerClasspath)
        }
        queue.submit(GenerateHoverMapsWorkAction::class.java) { params ->
            params.docsDir.set(docsDir)
            params.snippetsDir.set(snippetsDir)
            params.outputDir.set(outputDir)
            params.includeMdx.set(includeMdx)
            params.kotlinVersion.set(kotlinVersion)
            params.analysisClasspath.from(analysisClasspath)
        }
        queue.await()
    }
}
