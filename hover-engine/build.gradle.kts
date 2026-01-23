import org.gradle.api.tasks.testing.Test

plugins {
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":hover-schema"))
    implementation(kotlin("stdlib"))
    implementation("org.jetbrains.kotlin:analysis-api-standalone-for-ide:2.3.20-ij253-87") {
        isTransitive = false
    }
    implementation("org.jetbrains.kotlin:analysis-api-for-ide:2.3.20-ij253-87") {
        isTransitive = false
    }
    implementation("org.jetbrains.kotlin:analysis-api-k2-for-ide:2.3.20-ij253-87") {
        isTransitive = false
    }
    implementation("org.jetbrains.kotlin:kotlin-compiler-embeddable:2.1.20")
    testImplementation(kotlin("test"))
}

tasks.withType<Test>().configureEach {
    systemProperty("hovergen.classpath", configurations.getByName("compileClasspath").asPath)
}
