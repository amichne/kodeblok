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
