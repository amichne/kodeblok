plugins {
    alias(libs.plugins.kotlin.jvm) apply false
}

subprojects {
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
