plugins {
    `java-gradle-plugin`
    `maven-publish`
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    jvmToolchain(21)
}

dependencies {
    compileOnly(gradleApi())
    compileOnly(kotlin("gradle-plugin"))
    implementation(project(":kodeblok-engine"))
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

tasks.withType<Jar>().configureEach {
    manifest {
        attributes["Implementation-Version"] = project.version
    }
}
