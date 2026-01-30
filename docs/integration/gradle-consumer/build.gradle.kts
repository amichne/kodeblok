import org.gradle.kotlin.dsl.kotlin
import kodeblok.schema.InsightLevel

plugins {
    kotlin("jvm") version "2.3.0"
    id("com.kodeblok.hovermaps")
}

repositories {
    mavenLocal()
    mavenCentral()
    maven("https://www.jetbrains.com/intellij-repository/releases")
    maven("https://packages.jetbrains.team/maven/p/ij/intellij-dependencies")
    maven("https://maven.pkg.jetbrains.space/kotlin/p/kotlin/dev")
}

hoverMaps {
    docsDir.set(layout.projectDirectory.dir("docs"))
    snippetsDir.set(layout.projectDirectory.dir("docs/snippets"))
    outputDir.set(layout.projectDirectory.dir("build/hovermaps"))
    includeMdx.set(false)
    analysisLevel.set(InsightLevel.ALL)
    analysisClasspath.from(sourceSets.main.get().output)
    analysisClasspath.from(configurations.compileClasspath)
}
