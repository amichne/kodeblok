plugins {
    `java-gradle-plugin`
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(project(":hover-engine"))
    implementation(kotlin("stdlib"))
}

gradlePlugin {
    plugins {
        create("hoverMaps") {
            id = "com.komunasuarus.hovermaps"
            implementationClass = "hovergen.gradle.HoverMapsPlugin"
        }
    }
}
