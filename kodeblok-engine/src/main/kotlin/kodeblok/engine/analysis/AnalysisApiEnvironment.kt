package kodeblok.engine.analysis

import com.intellij.openapi.Disposable
import com.intellij.openapi.util.Disposer
import kodeblok.engine.HoverEngineException
import org.jetbrains.kotlin.analysis.api.standalone.StandaloneAnalysisAPISession
import org.jetbrains.kotlin.analysis.api.standalone.buildStandaloneAnalysisAPISession
import org.jetbrains.kotlin.analysis.api.projectStructure.KaSourceModule
import org.jetbrains.kotlin.analysis.project.structure.builder.buildKtLibraryModule
import org.jetbrains.kotlin.analysis.project.structure.builder.buildKtSdkModule
import org.jetbrains.kotlin.analysis.project.structure.builder.buildKtSourceModule
import org.jetbrains.kotlin.cli.common.config.addKotlinSourceRoot
import org.jetbrains.kotlin.cli.jvm.config.addJvmClasspathRoots
import org.jetbrains.kotlin.config.ApiVersion
import org.jetbrains.kotlin.config.CommonConfigurationKeys
import org.jetbrains.kotlin.config.CompilerConfiguration
import org.jetbrains.kotlin.config.JVMConfigurationKeys
import org.jetbrains.kotlin.config.LanguageVersion
import org.jetbrains.kotlin.config.LanguageVersionSettingsImpl
import org.jetbrains.kotlin.psi.KtFile
import org.jetbrains.kotlin.platform.jvm.JvmPlatforms
import java.nio.file.Files
import java.nio.file.Path

internal class AnalysisApiEnvironment(
    val session: StandaloneAnalysisAPISession,
    val ktFile: KtFile,
    private val disposable: Disposable,
    private val tempDir: Path,
) : AutoCloseable {
    override fun close() {
        Disposer.dispose(disposable)
        deleteRecursively(tempDir)
    }

    companion object {
        fun create(
            wrappedCode: String,
            config: AnalysisApiConfig,
            kotlinVersion: String,
        ): AnalysisApiEnvironment {
            val tempDir = Files.createTempDirectory("kodeblok")
            val sourcePath = tempDir.resolve("Snippet.kt")
            Files.writeString(sourcePath, wrappedCode)

            val disposable = Disposer.newDisposable("kodeblok-standalone")
            val compilerConfig = buildCompilerConfiguration(sourcePath, config, kotlinVersion)
            val moduleName = compilerConfig.get(CommonConfigurationKeys.MODULE_NAME) ?: "<no module name provided>"
            val languageVersionSettings = compilerConfig[CommonConfigurationKeys.LANGUAGE_VERSION_SETTINGS]
            val classpathRoots = config.classpath.distinct()
            var sourceModule: KaSourceModule? = null
            val session = buildStandaloneAnalysisAPISession(
                projectDisposable = disposable,
                unitTestMode = false
            ) {
                buildKtModuleProvider {
                    val platform = JvmPlatforms.defaultJvmPlatform
                    val libraryModule = buildKtLibraryModule {
                        this.platform = platform
                        addBinaryRoots(classpathRoots)
                        libraryName = "Library for $moduleName"
                    }
                    val sdkModule = buildKtSdkModule {
                        this.platform = platform
                        addBinaryRootsFromJdkHome(config.jdkHome, isJre = false)
                        libraryName = "JDK for $moduleName"
                    }
                    val createdSourceModule = buildKtSourceModule {
                        this.platform = platform
                        this.moduleName = moduleName
                        languageVersionSettings?.let { this.languageVersionSettings = it }
                        addSourceRoot(sourcePath)
                        addRegularDependency(libraryModule)
                        addRegularDependency(sdkModule)
                    }
                    addModule(createdSourceModule)
                    sourceModule = createdSourceModule

                    this.platform = platform
                }
            }

            val sourceAbsolute = sourcePath.toAbsolutePath().normalize()
            val sourceReal = runCatching { sourcePath.toRealPath().normalize() }.getOrDefault(sourceAbsolute)
            val moduleFiles = sourceModule?.let { module ->
                session.modulesWithFiles[module]
            } ?: session.modulesWithFiles.values.flatten()
            val sourceKtFiles = moduleFiles.filterIsInstance<KtFile>()
            val ktFile = sourceKtFiles.firstOrNull { file ->
                val virtualPath = file.virtualFile?.path ?: return@firstOrNull false
                val virtualAbsolute = runCatching { Path.of(virtualPath).toRealPath().normalize() }
                    .getOrElse { Path.of(virtualPath).normalize() }
                virtualAbsolute == sourceReal || virtualAbsolute == sourceAbsolute
            }
                ?: sourceKtFiles.firstOrNull { it.name == sourcePath.fileName.toString() }
                ?: sourceKtFiles.firstOrNull()
                ?: throw HoverEngineException("Standalone analysis did not produce a KtFile")

            return AnalysisApiEnvironment(session, ktFile, disposable, tempDir)
        }

        private fun buildCompilerConfiguration(
            sourcePath: Path,
            config: AnalysisApiConfig,
            kotlinVersion: String,
        ): CompilerConfiguration {
            val language = LanguageVersion.fromVersionString(kotlinVersion) ?: LanguageVersion.LATEST_STABLE
            return CompilerConfiguration().apply {
                put(CommonConfigurationKeys.MODULE_NAME, "kodeblok-snippet")
                put(
                    CommonConfigurationKeys.LANGUAGE_VERSION_SETTINGS,
                    LanguageVersionSettingsImpl(
                        languageVersion = language,
                        apiVersion = ApiVersion.createByLanguageVersion(language)
                    )
                )
                put(JVMConfigurationKeys.JDK_HOME, config.jdkHome.toFile())
                addKotlinSourceRoot(sourcePath.toString())
                addJvmClasspathRoots(config.classpath.map { it.toFile() })
            }
        }

        private fun deleteRecursively(path: Path) {
            if (!Files.exists(path)) return
            Files.walk(path)
                .sorted(Comparator.reverseOrder())
                .forEach { Files.deleteIfExists(it) }
        }
    }
}
