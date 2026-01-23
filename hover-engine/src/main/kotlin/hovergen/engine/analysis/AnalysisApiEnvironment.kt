package hovergen.engine.analysis

import com.intellij.openapi.Disposable
import com.intellij.openapi.util.Disposer
import hovergen.engine.HoverEngineException
import org.jetbrains.kotlin.analysis.api.standalone.StandaloneAnalysisAPISession
import org.jetbrains.kotlin.analysis.api.standalone.buildStandaloneAnalysisAPISession
import org.jetbrains.kotlin.analysis.project.structure.builder.KtLibraryModuleBuilder
import org.jetbrains.kotlin.analysis.project.structure.builder.KtModuleProviderBuilder
import org.jetbrains.kotlin.analysis.project.structure.builder.KtSdkModuleBuilder
import org.jetbrains.kotlin.analysis.project.structure.builder.KtSourceModuleBuilder
import org.jetbrains.kotlin.config.LanguageVersionSettingsImpl
import org.jetbrains.kotlin.platform.jvm.JvmPlatforms
import org.jetbrains.kotlin.psi.KtFile
import java.nio.file.Files
import java.nio.file.Path

internal class AnalysisApiEnvironment(
    val session: StandaloneAnalysisAPISession,
    val ktFile: KtFile,
    private val disposable: Disposable,
    private val tempDir: Path
) : AutoCloseable {
    override fun close() {
        Disposer.dispose(disposable)
        deleteRecursively(tempDir)
    }

    companion object {
        fun create(wrappedCode: String, config: AnalysisApiConfig): AnalysisApiEnvironment {
            val tempDir = Files.createTempDirectory("hovergen")
            val sourcePath = tempDir.resolve("Snippet.kt")
            Files.writeString(sourcePath, wrappedCode)

            val disposable = Disposer.newDisposable("hovergen-standalone")
            val session = buildStandaloneAnalysisAPISession(
                projectDisposable = disposable,
                unitTestMode = false
            ) {
                buildKtModuleProvider {
                    configureModules(this, sourcePath, config)
                }
            }

            val ktFile = session.modulesWithFiles.values
                .flatten()
                .filterIsInstance<KtFile>()
                .firstOrNull()
                ?: throw HoverEngineException("Standalone analysis did not produce a KtFile")

            return AnalysisApiEnvironment(session, ktFile, disposable, tempDir)
        }

        private fun configureModules(
            providerBuilder: KtModuleProviderBuilder,
            sourcePath: Path,
            config: AnalysisApiConfig
        ) {
            providerBuilder.platform = JvmPlatforms.defaultJvmPlatform

            val sdkModule = KtSdkModuleBuilder(
                providerBuilder.coreApplicationEnvironment,
                providerBuilder.project
            ).apply {
                platform = JvmPlatforms.defaultJvmPlatform
                addBinaryRootsFromJdkHome(config.jdkHome, false)
            }.build()
            providerBuilder.addModule(sdkModule)

            val libraryModules = config.classpath.map { path ->
                KtLibraryModuleBuilder(
                    providerBuilder.coreApplicationEnvironment,
                    providerBuilder.project,
                    false
                ).apply {
                    platform = JvmPlatforms.defaultJvmPlatform
                    libraryName = path.fileName.toString()
                    addBinaryRoot(path)
                }.build()
            }
            libraryModules.forEach { providerBuilder.addModule(it) }

            val sourceModule = KtSourceModuleBuilder(
                providerBuilder.coreApplicationEnvironment,
                providerBuilder.project
            ).apply {
                platform = JvmPlatforms.defaultJvmPlatform
                moduleName = "hovergen-snippet"
                languageVersionSettings = LanguageVersionSettingsImpl.DEFAULT
                addSourceRoot(sourcePath.parent)
                addRegularDependency(sdkModule)
                libraryModules.forEach { addRegularDependency(it) }
            }.build()

            providerBuilder.addModule(sourceModule)
        }

        private fun deleteRecursively(path: Path) {
            if (!Files.exists(path)) return
            Files.walk(path)
                .sorted(Comparator.reverseOrder())
                .forEach { Files.deleteIfExists(it) }
        }
    }
}
