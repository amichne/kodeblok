plugins {
//    alias(libs.plugins.kotlin.jvm) apply false
    kotlin("jvm") version "2.3.0"
}

subprojects {
    group = "com.kodeblok"
    version = providers.gradleProperty("kodeblok.plugin.version")
        .orElse(providers.gradleProperty("kodeblok.cli.version"))
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
    description = "Publish the kodeblok-gradle plugin to configured Maven repositories."
    dependsOn(
        ":kodeblok-schema:publish",
        ":kodeblok-engine:publish",
        ":kodeblok-gradle:publish",
    )
}

tasks.register("publishHoverGradlePluginToMavenLocal") {
    group = "publishing"
    description = "Publish the kodeblok-gradle plugin to Maven Local for development testing."
    dependsOn(
        ":kodeblok-schema:publishToMavenLocal",
        ":kodeblok-engine:publishToMavenLocal",
        ":kodeblok-gradle:publishToMavenLocal",
    )
}

tasks.register<Exec>("validateHoverGradleIntegration") {
    group = "verification"
    description = "Runs the golden-path consumer build for the kodeblok-gradle plugin."
    dependsOn("publishHoverGradlePluginToMavenLocal")

    val intellijHome = providers.gradleProperty("intellijHome")
                           .orNull
                       ?: error("Missing intellijHome property (set to IntelliJ IDEA app path).")
    val hoverPluginVersion = providers.gradleProperty("kodeblok.plugin.version")
        .orElse(providers.gradleProperty("kodeblok.cli.version"))
        .orElse("0.1.0-SNAPSHOT")

    val consumerDir = file("docs/integration/gradle-consumer")
    commandLine(
        file("gradlew").absolutePath,
        "-p",
        consumerDir.absolutePath,
        "generateHoverMaps",
        "-PintellijHome=$intellijHome",
        "-PhoverPluginVersion=${hoverPluginVersion.get()}",
        "--refresh-dependencies",
    )
}
dependencies {
    implementation(kotlin("stdlib-jdk8"))
}
repositories {
    mavenCentral()
}
kotlin {
    jvmToolchain(8)
}
