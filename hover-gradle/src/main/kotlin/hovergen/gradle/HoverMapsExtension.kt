package hovergen.gradle

import org.gradle.api.file.DirectoryProperty
import org.gradle.api.model.ObjectFactory
import org.gradle.api.provider.Property
import javax.inject.Inject

abstract class HoverMapsExtension @Inject constructor(objects: ObjectFactory) {
    val docsDir: DirectoryProperty = objects.directoryProperty()
    val snippetsDir: DirectoryProperty = objects.directoryProperty()
    val outputDir: DirectoryProperty = objects.directoryProperty()
    val includeMdx: Property<Boolean> = objects.property(Boolean::class.java)
    val kotlinVersion: Property<String> = objects.property(String::class.java)
}
