package hovergen.gradle

import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.GradleException
import org.jetbrains.kotlin.gradle.plugin.getKotlinPluginVersion

class HoverMapsPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val intellijHome = project.findProperty("intellijHome") as String?
            ?: throw GradleException("Missing intellijHome property (set to IntelliJ IDEA app path).")
        val kotlinPluginLibDir = project.file("$intellijHome/Contents/plugins/Kotlin/lib")
        if (!kotlinPluginLibDir.exists()) {
            throw GradleException("Kotlin plugin lib directory not found at ${kotlinPluginLibDir.path}")
        }

        val extension = project.extensions.create("hoverMaps", HoverMapsExtension::class.java)
        extension.docsDir.convention(project.layout.projectDirectory.dir("docs"))
        extension.snippetsDir.convention(project.layout.projectDirectory.dir("docs/snippets"))
        extension.outputDir.convention(project.layout.projectDirectory.dir("website/static/hovermaps"))
        extension.includeMdx.convention(true)
        extension.kotlinVersion.convention(project.getKotlinPluginVersion())

        val kotlinPluginJars = project.fileTree(kotlinPluginLibDir).matching { it.include("*.jar") }

        project.tasks.register("generateHoverMaps", GenerateHoverMapsTask::class.java) { task ->
            task.group = "documentation"
            task.description = "Generate hover maps for Kotlin snippets"
            task.docsDir.set(extension.docsDir)
            task.snippetsDir.set(extension.snippetsDir)
            task.outputDir.set(extension.outputDir)
            task.includeMdx.set(extension.includeMdx)
            task.kotlinVersion.set(extension.kotlinVersion)
            task.classpath.from(kotlinPluginJars)
            project.configurations.findByName("compileClasspath")?.let { task.classpath.from(it) }
        }
    }
}
