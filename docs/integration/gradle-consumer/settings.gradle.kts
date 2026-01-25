pluginManagement {
    val hoverPluginVersion: String by settings

    repositories {
        mavenLocal()
        maven("https://www.jetbrains.com/intellij-repository/releases")
        maven("https://packages.jetbrains.team/maven/p/ij/intellij-dependencies")
        maven("https://maven.pkg.jetbrains.space/kotlin/p/kotlin/dev")
        gradlePluginPortal()
        mavenCentral()
    }
    resolutionStrategy {
        eachPlugin {
            if (requested.id.id == "com.komunasuarus.hovermaps") {
                useVersion(hoverPluginVersion)
            }
        }
    }
}

rootProject.name = "hovermaps-consumer"
