plugins {
    alias(libs.plugins.kotlin.jvm)
    `java-library`
    `maven-publish`
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        freeCompilerArgs.add("-Xcontext-parameters")
    }
}

val kotlinVersion = libs.versions.kotlin.get()
val analysisApiVersion = "2.3.20-ij253-87"

val intellijHome = project.findProperty("intellijHome") as String?
                   ?: error("Missing intellijHome property (set to IntelliJ IDEA app path).")
val kotlinPluginJar = file("$intellijHome/Contents/plugins/Kotlin/lib/kotlin-plugin.jar")
val kotlinPluginLibDir = file("$intellijHome/Contents/plugins/Kotlin/lib")
if (!kotlinPluginJar.exists()) {
    error("Kotlin plugin jar not found at ${kotlinPluginJar.path}")
}
if (!kotlinPluginLibDir.exists()) {
    error("Kotlin plugin lib directory not found at ${kotlinPluginLibDir.path}")
}

val analysisApiResourcesJar = layout.buildDirectory.file("analysis-api-resources.jar")
val extractAnalysisApiResources by tasks.registering(Zip::class) {
    from(zipTree(kotlinPluginJar)) {
        include("META-INF/analysis-api/**")
    }
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    archiveFileName.set(analysisApiResourcesJar.get().asFile.name)
    destinationDirectory.set(analysisApiResourcesJar.get().asFile.parentFile)
}

dependencies {
    api(project(":hover-schema"))
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlin:kotlin-compiler:$kotlinVersion")
    implementation(files(rootProject.file("libs/analysis-api-providers-for-ide-2.0.0-dev-8570.jar")))

    implementation("org.jetbrains.kotlin:analysis-api-standalone-for-ide:$analysisApiVersion") {
        isTransitive = false
    }
    implementation("org.jetbrains.kotlin:analysis-api-for-ide:$analysisApiVersion") {
        isTransitive = false
    }
    implementation("org.jetbrains.kotlin:analysis-api-k2-for-ide:$analysisApiVersion") {
        isTransitive = false
    }
    implementation("org.jetbrains.kotlin:analysis-api-impl-base-for-ide:$analysisApiVersion") {
        isTransitive = false
    }

    runtimeOnly(files(analysisApiResourcesJar).builtBy(extractAnalysisApiResources))
    runtimeOnly(fileTree(kotlinPluginLibDir) { include("*.jar") })
    runtimeOnly("com.github.ben-manes.caffeine:caffeine:3.1.8")
    runtimeOnly("org.jetbrains.kotlinx:kotlinx-serialization-core:1.7.3")

    testImplementation(kotlin("test"))
}

tasks.withType<Test>().configureEach {
    systemProperty("hovergen.classpath", configurations.getByName("compileClasspath").asPath)
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
        }
    }
}
