plugins {
    alias(libs.plugins.kotlin.jvm) apply false
}

subprojects {
    repositories {
        mavenCentral()
        maven {
            url = uri("https://packages.jetbrains.team/maven/p/ij/intellij-dependencies")
        }
    }
}
