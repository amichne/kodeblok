package hovergen.cli

import hovergen.engine.*
import hovergen.engine.analysis.AnalysisApiConfig
import hovergen.engine.analysis.AnalysisApiSemanticAnalyzer
import java.io.File
import java.nio.file.Path
import kotlin.system.exitProcess

/**
 * Standalone CLI for generating hover maps from Kotlin snippets.
 */
fun main(args: Array<String>) {
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
            println("  Classpath:    ${config.classpath.joinToString(":")}")
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
        val analyzer = AnalysisApiSemanticAnalyzer(analysisConfig)
        val engine = HoverEngine(analyzer)

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
                val hoverMap = engine.generateHoverMap(source, config.kotlinVersion)
                HoverMapWriter.write(hoverMap, outputPath)
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
    val verbose: Boolean
)

fun parseArgs(args: Array<String>): CliConfig? {
    if (args.isEmpty() || args.contains("--help") || args.contains("-h")) {
        return null
    }

    var snippetsDir: File? = null
    var docsDir: File? = null
    var outputDir: File? = null
    var includeMdx = true
    var kotlinVersion = ENGINE_KOTLIN_VERSION
    val classpath = mutableListOf<String>()
    var jdkHome: String? = null
    var verbose = false

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
                classpath.addAll(cpValue.split(":"))
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
    println("""
        Komunasuarus Hover Maps Generator - Standalone CLI

        Usage: hover-cli [OPTIONS]

        Required Options:
          -s, --snippets-dir <path>     Directory containing Kotlin snippet files
          -o, --output-dir <path>       Directory to write hover map JSON files

        Optional Options:
          -d, --docs-dir <path>         Directory to scan for MDX files (default: same as snippets-dir)
          --no-mdx                      Don't extract snippets from MDX files
          -k, --kotlin-version <ver>    Kotlin version for validation (default: $ENGINE_KOTLIN_VERSION)
          -cp, --classpath <paths>      Colon-separated classpath for Analysis API
          --jdk-home <path>             JDK home directory for Analysis API
          -v, --verbose                 Enable verbose error output
          -h, --help                    Show this help message

        Examples:
          # Basic usage - extract from snippets directory
          hover-cli --snippets-dir ./docs/snippets --output-dir ./output

          # With MDX extraction
          hover-cli -s ./docs/snippets -d ./docs -o ./output

          # With custom classpath for semantic analysis
          hover-cli -s ./snippets -o ./maps -cp "./lib/*:./build/classes"

          # Disable MDX scanning, verbose output
          hover-cli -s ./snippets -o ./maps --no-mdx -v
    """.trimIndent())
}
