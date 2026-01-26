plugins {
    kotlin("jvm")
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(project(":kodeblok-engine"))
    implementation(project(":kodeblok-schema"))
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
}

val generateBuildConfig by tasks.registering {
    val version = project.findProperty("kodeblok.cli.version") as String? ?: "dev"
    val outputDir = layout.buildDirectory.dir("generated/source/buildConfig")

    inputs.property("version", version)
    outputs.dir(outputDir)

    doLast {
        val file = outputDir.get().asFile.resolve("kodeblok/cli/BuildConfig.kt")
        file.parentFile.mkdirs()
        file.writeText(
            """
            package hovergen.cli

            object BuildConfig {
                const val VERSION = "$version"
            }
        """.trimIndent()
        )
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
    dependsOn(":kodeblok-engine:assemble", ":kodeblok-schema:jar")

    isZip64 = true

    manifest {
        attributes["Main-Class"] = "hovergen.cli.HoverCliKt"
    }

    // Create a fat JAR with all dependencies
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE

    from(configurations.runtimeClasspath.get().map {
        if (it.isDirectory) it else zipTree(it)
    })

    // Explicitly merge META-INF/services files (for ServiceLoader)
    from(configurations.runtimeClasspath.get().map {
        if (!it.isDirectory) {
            zipTree(it).matching {
                include("META-INF/services/**")
            }
        } else {
            files()
        }
    }) {
        into("META-INF/services")
        duplicatesStrategy = DuplicatesStrategy.INCLUDE
    }

    archiveBaseName.set("kodeblok-cli")
    archiveVersion.set(project.findProperty("kodeblok.cli.version") as String? ?: "dev")
}

val createJre by tasks.registering(Exec::class) {
    description = "Creates a minimal JRE for macOS using jlink"
    group = "distribution"

    val jreOutputDir = layout.buildDirectory.dir("jre-macos")

    inputs.property("javaHome", System.getProperty("java.home"))
    outputs.dir(jreOutputDir)

    doFirst {
        delete(jreOutputDir)
    }

    commandLine(
        "${System.getProperty("java.home")}/bin/jlink",
        "--add-modules",
        "java.base,java.logging,java.xml,java.desktop,java.management,jdk.compiler,jdk.unsupported,jdk.zipfs,jdk.jfr",
        "--output",
        jreOutputDir.get().asFile.absolutePath,
        "--compress",
        "2",
        "--no-header-files",
        "--no-man-pages",
        "--strip-debug"
    )
}

val processShellScript by tasks.registering {
    description = "Processes shell script template"
    group = "distribution"

    val templateFile = file("src/dist/bin/kodeblok-cli.template")
    val outputFile = layout.buildDirectory.file("scripts/kodeblok-cli")

    inputs.file(templateFile)
    outputs.file(outputFile)

    doLast {
        outputFile.get().asFile.parentFile.mkdirs()
        templateFile.copyTo(outputFile.get().asFile, overwrite = true)
        outputFile.get().asFile.setExecutable(true)
    }
}

val assembleMacosDistribution by tasks.registering(Copy::class) {
    description = "Assembles the complete macOS distribution"
    group = "distribution"

    dependsOn(tasks.jar, createJre, processShellScript)

    val distDir = layout.buildDirectory.dir("dist/kodeblok-cli")

    into(distDir)

    // Copy shell wrapper to bin/
    from(processShellScript) {
        into("bin")
    }

    // Copy fat JAR to lib/
    from(tasks.jar) {
        into("lib")
        rename { "kodeblok-cli.jar" }
    }

    // Copy JRE to jre/
    from(createJre) {
        into("jre")
    }

    doLast {
        val binDir = distDir.get().asFile.resolve("bin")
        binDir.listFiles()?.forEach { it.setExecutable(true) }
    }
}

val createMacosTarball by tasks.registering(Tar::class) {
    description = "Creates a .tar.gz distribution for macOS"
    group = "distribution"

    dependsOn(assembleMacosDistribution)

    val version = project.findProperty("kodeblok.cli.version") as String? ?: "dev"
    archiveBaseName.set("kodeblok-cli-macos")
    archiveVersion.set(version)
    compression = Compression.GZIP
    archiveExtension.set("tar.gz")

    from(layout.buildDirectory.dir("dist"))

    destinationDirectory.set(layout.buildDirectory.dir("distributions"))

    // Preserve file and directory permissions from source
    isPreserveFileTimestamps = false
}

kotlin {
    jvmToolchain(21)
}
