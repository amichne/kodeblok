package kodeblok.gradle

import org.gradle.api.GradleException
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.gradle.api.plugins.JavaPluginExtension
import org.jetbrains.kotlin.gradle.plugin.getKotlinPluginVersion

class KodeblokMapsPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val pluginVersion = KodeblokMapsPlugin::class.java.`package`.implementationVersion
                            ?: project.findProperty("hover.plugin.version")?.toString()
                            ?: project.findProperty("kodeblok.cli.version")?.toString()
                            ?: throw GradleException("Unable to determine hovermaps plugin version.")
        val intellijHome = project.findProperty("intellijHome") as String?
                           ?: throw GradleException("Missing intellijHome property (set to IntelliJ IDEA app path).")
        val kotlinPluginLibDir = project.file("$intellijHome/Contents/plugins/Kotlin/lib")
        if (!kotlinPluginLibDir.exists()) {
            throw GradleException("Kotlin plugin lib directory not found at ${kotlinPluginLibDir.path}")
        }

        val extension = project.extensions.create("hoverMaps", KodeblokMapsExtension::class.java)
        extension.docsDir.convention(project.layout.projectDirectory.dir("docs"))
        extension.snippetsDir.convention(project.layout.projectDirectory.dir("docs/snippets"))
        extension.outputDir.convention(project.layout.projectDirectory.dir("website/static/hovermaps"))
        extension.includeMdx.convention(true)
        extension.kotlinVersion.convention(project.getKotlinPluginVersion())

        val kotlinPluginJars = project.fileTree(kotlinPluginLibDir).matching { it.include("*.jar") }
        val pluginJar = KodeblokMapsPlugin::class.java.protectionDomain.codeSource?.location?.toURI()
                            ?.let { project.file(it) }
                        ?: throw GradleException("Unable to locate hovermaps plugin jar.")
        val engineClasspath = project.configurations.detachedConfiguration(
            project.dependencies.create("com.kodeblok:kodeblok-engine:$pluginVersion")
        ).apply {
            isTransitive = true
            resolutionStrategy.force(
                "org.jetbrains.kotlin:kotlin-stdlib:${extension.kotlinVersion.get()}",
                "org.jetbrains.kotlin:kotlin-stdlib-jdk7:${extension.kotlinVersion.get()}",
                "org.jetbrains.kotlin:kotlin-stdlib-jdk8:${extension.kotlinVersion.get()}",
                "org.jetbrains.kotlin:kotlin-reflect:${extension.kotlinVersion.get()}",
            )
        }

        project.tasks.register("generateHoverMaps", GenerateHoverMapsTask::class.java) { task ->
            task.group = "documentation"
            task.description = "Generate hover maps for Kotlin snippets"
            task.docsDir.set(extension.docsDir)
            task.snippetsDir.set(extension.snippetsDir)
            task.outputDir.set(extension.outputDir)
            task.includeMdx.set(extension.includeMdx)
            task.kotlinVersion.set(extension.kotlinVersion)
            task.workerClasspath.from(kotlinPluginJars, engineClasspath, pluginJar)
            task.analysisClasspath.from(extension.analysisClasspath)
            val sourceSets = project.extensions.findByType(JavaPluginExtension::class.java)?.sourceSets
            sourceSets?.findByName("main")?.let { main ->
                task.analysisClasspath.from(main.output)
            }
            project.configurations.findByName("compileClasspath")
                ?.let { task.analysisClasspath.from(it) }
            ?: task.analysisClasspath.from(engineClasspath)
        }
    }
}
