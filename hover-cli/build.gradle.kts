plugins {
    kotlin("jvm")
    application
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(project(":hover-engine"))
    implementation(project(":hover-schema"))
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
}

application {
    mainClass.set("hovergen.cli.HoverCliKt")
}

tasks.jar {
    manifest {
        attributes["Main-Class"] = "hovergen.cli.HoverCliKt"
    }
    // Create a fat JAR with all dependencies
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    from(configurations.runtimeClasspath.get().map { if (it.isDirectory) it else zipTree(it) })
}

kotlin {
    jvmToolchain(21)
}
