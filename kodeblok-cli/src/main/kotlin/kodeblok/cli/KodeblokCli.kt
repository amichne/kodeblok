package kodeblok.cli

import kodeblok.cli.BuildConfig
import kodeblok.engine.ENGINE_KOTLIN_VERSION
import kodeblok.engine.KodeblokEngine
import kodeblok.engine.KodeblokMapWriter
import kodeblok.engine.SnippetExtractor
import kodeblok.engine.analysis.AnalysisApiConfig
import kodeblok.engine.analysis.AnalysisApiEagerAnalyzer
import java.io.File
import java.nio.file.Path
import kotlin.system.exitProcess

/**
 * Standalone CLI for generating hover maps from Kotlin snippets.
 */
fun main(args: Array<String>) {
    // Handle --version flag
    if (args.contains("--version")) {
        println("Komunasuarus Hover CLI version ${BuildConfig.VERSION}")
        exitProcess(0)
    }

    val config = parseArgs(args) ?: run {
        printUsage()
        exitProcess(1)
    }

    try {
        println("Komunasuarus Hover Maps Generator")
        println("==================================")
        println()
        println("Configuration:")
        println("  Snippets dir: ${config.snippetsDir.absolutePath}")
        println("  Output dir:   ${config.outputDir.absolutePath}")
        println("  Include MDX:  ${config.includeMdx}")
        println("  Kotlin ver:   ${config.kotlinVersion}")
        if (config.classpath.isNotEmpty()) {
            println("  Classpath:    ${config.classpath.joinToString(File.pathSeparator)}")
        }
        if (config.jdkHome != null) {
            println("  JDK home:     ${config.jdkHome}")
        }
        println()

        // Create output directory if it doesn't exist
        config.outputDir.mkdirs()

        // Initialize semantic analyzer with Analysis API
        val analysisConfig = if (config.jdkHome != null) {
            AnalysisApiConfig(
                classpath = config.classpath.map { Path.of(it) },
                jdkHome = Path.of(config.jdkHome)
            )
        } else {
            AnalysisApiConfig(
                classpath = config.classpath.map { Path.of(it) }
            )
        }
        val analyzer = AnalysisApiEagerAnalyzer(analysisConfig)
        val engine = KodeblokEngine(analyzer)

        // Extract snippets
        println("Extracting snippets...")
        val extractor = SnippetExtractor()
        val snippets = extractor.extract(
            snippetsDir = config.snippetsDir.toPath(),
            docsDir = config.docsDir.toPath(),
            includeMdx = config.includeMdx
        )
        println("Found ${snippets.size} snippet(s)")
        println()

        // Generate hover maps
        val outputPath = config.outputDir.toPath()
        var successCount = 0
        var failureCount = 0

        snippets.forEach { source ->
            try {
                print("Processing ${source.snippetId}... ")
                val profile = engine.generateSemanticProfile(source, config.kotlinVersion)
                KodeblokMapWriter.write(profile, outputPath)
                println("✓")
                successCount++
            } catch (e: Exception) {
                println("✗")
                System.err.println("  Error: ${e.message}")
                if (config.verbose) {
                    e.printStackTrace()
                }
                failureCount++
            }
        }

        println()
        println("Summary:")
        println("  Success: $successCount")
        println("  Failed:  $failureCount")
        println("  Output:  ${config.outputDir.absolutePath}")

        if (failureCount > 0) {
            exitProcess(1)
        }
    } catch (e: Exception) {
        System.err.println("Fatal error: ${e.message}")
        if (config.verbose) {
            e.printStackTrace()
        }
        exitProcess(1)
    }
}

data class CliConfig(
    val snippetsDir: File,
    val docsDir: File,
    val outputDir: File,
    val includeMdx: Boolean,
    val kotlinVersion: String,
    val classpath: List<String>,
    val jdkHome: String?,
    val verbose: Boolean,
)

private data class EnvBooleanResult(
    val value: Boolean?,
    val invalid: Boolean,
)

private fun envValue(name: String): String? =
    System.getenv(name)?.trim()?.takeIf { it.isNotEmpty() }

private fun readEnvBoolean(name: String): EnvBooleanResult {
    val raw = envValue(name) ?: return EnvBooleanResult(null, false)
    return when (raw.lowercase()) {
        "1", "true", "yes", "y", "on" -> EnvBooleanResult(true, false)
        "0", "false", "no", "n", "off" -> EnvBooleanResult(false, false)
        else -> {
            System.err.println("Invalid value for $name: $raw (expected true/false)")
            EnvBooleanResult(null, true)
        }
    }
}

private fun splitClasspath(value: String): List<String> =
    value.split(File.pathSeparator).map { it.trim() }.filter { it.isNotEmpty() }

fun parseArgs(args: Array<String>): CliConfig? {
    if (args.contains("--help") || args.contains("-h")) {
        return null
    }

    var snippetsDir: File? = envValue("KODEBLOK_SNIPPETS_DIR")?.let(::File)
    var docsDir: File? = envValue("KODEBLOK_DOCS_DIR")?.let(::File)
    var outputDir: File? = envValue("KODEBLOK_OUTPUT_DIR")?.let(::File)

    val includeMdxEnv = readEnvBoolean("KODEBLOK_INCLUDE_MDX")
    if (includeMdxEnv.invalid) return null
    var includeMdx = includeMdxEnv.value ?: true

    var kotlinVersion = envValue("KODEBLOK_KOTLIN_VERSION") ?: ENGINE_KOTLIN_VERSION
    val classpath = mutableListOf<String>().apply {
        envValue("KODEBLOK_CLASSPATH")?.let { addAll(splitClasspath(it)) }
    }

    var jdkHome: String? = envValue("KODEBLOK_JDK_HOME")

    val verboseEnv = readEnvBoolean("KODEBLOK_VERBOSE")
    if (verboseEnv.invalid) return null
    var verbose = verboseEnv.value ?: false

    var i = 0
    while (i < args.size) {
        when (args[i]) {
            "--snippets-dir", "-s" -> {
                snippetsDir = File(args.getOrNull(++i) ?: run {
                    System.err.println("Missing value for ${args[i - 1]}")
                    return null
                })
            }
            "--docs-dir", "-d" -> {
                docsDir = File(args.getOrNull(++i) ?: run {
                    System.err.println("Missing value for ${args[i - 1]}")
                    return null
                })
            }
            "--output-dir", "-o" -> {
                outputDir = File(args.getOrNull(++i) ?: run {
                    System.err.println("Missing value for ${args[i - 1]}")
                    return null
                })
            }
            "--no-mdx" -> {
                includeMdx = false
            }
            "--kotlin-version", "-k" -> {
                kotlinVersion = args.getOrNull(++i) ?: run {
                    System.err.println("Missing value for ${args[i - 1]}")
                    return null
                }
            }
            "--classpath", "-cp" -> {
                val cpValue = args.getOrNull(++i) ?: run {
                    System.err.println("Missing value for ${args[i - 1]}")
                    return null
                }
                classpath.addAll(splitClasspath(cpValue))
            }
            "--jdk-home" -> {
                jdkHome = args.getOrNull(++i) ?: run {
                    System.err.println("Missing value for ${args[i - 1]}")
                    return null
                }
            }
            "--verbose", "-v" -> {
                verbose = true
            }
            else -> {
                System.err.println("Unknown option: ${args[i]}")
                return null
            }
        }
        i++
    }

    // Validate required arguments
    if (snippetsDir == null) {
        System.err.println("Missing required argument: --snippets-dir")
        return null
    }
    if (outputDir == null) {
        System.err.println("Missing required argument: --output-dir")
        return null
    }

    // Default docs dir to snippets dir if not specified
    if (docsDir == null) {
        docsDir = snippetsDir
    }

    // Validate directories exist
    if (!snippetsDir.exists()) {
        System.err.println("Snippets directory does not exist: ${snippetsDir.absolutePath}")
        return null
    }
    if (!docsDir.exists()) {
        System.err.println("Docs directory does not exist: ${docsDir.absolutePath}")
        return null
    }

    return CliConfig(
        snippetsDir = snippetsDir,
        docsDir = docsDir,
        outputDir = outputDir,
        includeMdx = includeMdx,
        kotlinVersion = kotlinVersion,
        classpath = classpath,
        jdkHome = jdkHome,
        verbose = verbose
    )
}

fun printUsage() {
    println(
        """
        Komunasuarus Hover Maps Generator - Standalone CLI

        Usage: kodeblok-cli [OPTIONS]

        Required Options:
          -s, --snippets-dir <path>     Directory containing Kotlin snippet files
          -o, --output-dir <path>       Directory to write hover map JSON files

        Optional Options:
          -d, --docs-dir <path>         Directory to scan for MDX files (default: same as snippets-dir)
          --no-mdx                      Don't extract snippets from MDX files
          -k, --kotlin-version <ver>    Kotlin version for validation (default: $ENGINE_KOTLIN_VERSION)
          -cp, --classpath <paths>      Classpath for Analysis API (use OS path separator)
          --jdk-home <path>             JDK home directory for Analysis API
          -v, --verbose                 Enable verbose error output
          -h, --help                    Show this help message

        Environment Defaults (overridden by CLI options):
          KODEBLOK_SNIPPETS_DIR            Same as --snippets-dir
          KODEBLOK_DOCS_DIR                Same as --docs-dir
          KODEBLOK_OUTPUT_DIR              Same as --output-dir
          KODEBLOK_INCLUDE_MDX             true/false (default: true)
          KODEBLOK_KOTLIN_VERSION          Same as --kotlin-version
          KODEBLOK_CLASSPATH               Classpath (use OS path separator)
          KODEBLOK_JDK_HOME                Same as --jdk-home
          KODEBLOK_VERBOSE                 true/false (default: false)

        Examples:
          # Basic usage - extract from snippets directory
          kodeblok-cli --snippets-dir ./docs/snippets --output-dir ./output

          # With MDX extraction
          kodeblok-cli -s ./docs/snippets -d ./docs -o ./output

          # With custom classpath for semantic analysis
          kodeblok-cli -s ./snippets -o ./maps -cp "./lib/*:./build/classes"

          # Disable MDX scanning, verbose output
          kodeblok-cli -s ./snippets -o ./maps --no-mdx -v
    """.trimIndent()
    )
}
