plugins {
    kotlin("jvm")
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(project(":hover-engine"))
    implementation(project(":hover-schema"))
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
}

val generateBuildConfig by tasks.registering {
    val version = project.findProperty("hover.cli.version") as String? ?: "dev"
    val outputDir = layout.buildDirectory.dir("generated/source/buildConfig")

    inputs.property("version", version)
    outputs.dir(outputDir)

    doLast {
        val file = outputDir.get().asFile.resolve("hovergen/cli/BuildConfig.kt")
        file.parentFile.mkdirs()
        file.writeText("""
            package hovergen.cli

            object BuildConfig {
                const val VERSION = "$version"
            }
        """.trimIndent())
    }
}

tasks.compileKotlin {
    dependsOn(generateBuildConfig)
}

sourceSets {
    main {
        kotlin.srcDir(layout.buildDirectory.dir("generated/source/buildConfig"))
    }
}

application {
    mainClass.set("hovergen.cli.HoverCliKt")
}

tasks.jar {
    manifest {
        attributes["Main-Class"] = "hovergen.cli.HoverCliKt"
    }
    // Create a fat JAR with all dependencies
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
}

kotlin {
    jvmToolchain(21)
}
