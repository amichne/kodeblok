package hovergen.engine.analysis

import com.intellij.openapi.Disposable
import com.intellij.openapi.util.Disposer
import hovergen.engine.HoverEngineException
import org.jetbrains.kotlin.analysis.api.standalone.StandaloneAnalysisAPISession
import org.jetbrains.kotlin.analysis.api.standalone.buildStandaloneAnalysisAPISession
import org.jetbrains.kotlin.cli.common.config.addKotlinSourceRoot
import org.jetbrains.kotlin.cli.jvm.config.addJvmClasspathRoots
import org.jetbrains.kotlin.config.ApiVersion
import org.jetbrains.kotlin.config.CommonConfigurationKeys
import org.jetbrains.kotlin.config.CompilerConfiguration
import org.jetbrains.kotlin.config.JVMConfigurationKeys
import org.jetbrains.kotlin.config.LanguageVersion
import org.jetbrains.kotlin.config.LanguageVersionSettingsImpl
import org.jetbrains.kotlin.psi.KtFile
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
            val tempDir = Files.createTempDirectory("hovergen")
            val sourcePath = tempDir.resolve("Snippet.kt")
            Files.writeString(sourcePath, wrappedCode)

            val disposable = Disposer.newDisposable("hovergen-standalone")
            val compilerConfig = buildCompilerConfiguration(sourcePath, config, kotlinVersion)
            val session = buildStandaloneAnalysisAPISession(
                projectDisposable = disposable,
                unitTestMode = false
            ) {
                buildKtModuleProviderByCompilerConfiguration(compilerConfig)
            }

            val ktFile = session.modulesWithFiles.values
                             .flatten()
                             .filterIsInstance<KtFile>()
                             .firstOrNull()
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
                put(CommonConfigurationKeys.MODULE_NAME, "hovergen-snippet")
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
