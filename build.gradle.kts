plugins {
    alias(libs.plugins.kotlin.jvm) apply false
}

subprojects {
    group = "com.komunasuarus"
    version = providers.gradleProperty("hover.plugin.version")
        .orElse(providers.gradleProperty("hover.cli.version"))
        .orElse("0.1.0-SNAPSHOT")
        .get()

    repositories {
        mavenCentral()
        maven {
            url = uri("https://www.jetbrains.com/intellij-repository/releases")
        }
        maven {
            url = uri("https://packages.jetbrains.team/maven/p/ij/intellij-dependencies")
        }
        maven {
            url = uri("https://maven.pkg.jetbrains.space/kotlin/p/kotlin/dev")
        }
    }
}

tasks.register("publishHoverGradlePlugin") {
    group = "publishing"
    description = "Publish the hover-gradle plugin to configured Maven repositories."
    dependsOn(
        ":hover-schema:publish",
        ":hover-engine:publish",
        ":hover-gradle:publish",
    )
}

tasks.register("publishHoverGradlePluginToMavenLocal") {
    group = "publishing"
    description = "Publish the hover-gradle plugin to Maven Local for development testing."
    dependsOn(
        ":hover-schema:publishToMavenLocal",
        ":hover-engine:publishToMavenLocal",
        ":hover-gradle:publishToMavenLocal",
    )
}
