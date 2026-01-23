import org.gradle.api.tasks.testing.Test

plugins {
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        freeCompilerArgs.add("-Xcontext-parameters")
    }
}

val intellijSdk = project.findProperty("intellijSdk") as String?
    ?: error("Missing intellijSdk property (define in gradle.properties).")
val kotlinVersion = libs.versions.kotlin.get()

val analysisApiVersion = "2.3.20-ij253-87"

dependencies {
    implementation(project(":hover-schema"))
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlin:kotlin-compiler:$kotlinVersion")
    implementation(files(rootProject.file("libs/analysis-api-providers-for-ide-2.0.0-dev-8570.jar")))
    implementation("com.jetbrains.intellij.platform:util-rt:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.platform:util-class-loader:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.platform:util:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.platform:util-base:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.platform:util-xml-dom:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.platform:core:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.platform:core-impl:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.platform:extensions:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.java:java-frontback-psi:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.java:java-frontback-psi-impl:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.java:java-psi:$intellijSdk") { isTransitive = false }
    implementation("com.jetbrains.intellij.java:java-psi-impl:$intellijSdk") { isTransitive = false }
    runtimeOnly("com.jetbrains.intellij.platform:diagnostic:$intellijSdk") { isTransitive = false }
    runtimeOnly("com.jetbrains.intellij.platform:diagnostic-telemetry:$intellijSdk") { isTransitive = false }
    runtimeOnly("com.jetbrains.intellij.platform:util-progress:$intellijSdk") { isTransitive = false }
    runtimeOnly("com.jetbrains.intellij.platform:util-coroutines:$intellijSdk") { isTransitive = false }
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
    testImplementation(kotlin("test"))
}

tasks.withType<Test>().configureEach {
    systemProperty("hovergen.classpath", configurations.getByName("compileClasspath").asPath)
}
