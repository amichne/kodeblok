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
    testImplementation(kotlin("test"))
}

tasks.withType<Test>().configureEach {
    systemProperty("hovergen.classpath", configurations.getByName("compileClasspath").asPath)
}
