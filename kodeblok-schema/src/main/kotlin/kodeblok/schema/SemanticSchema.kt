package kodeblok.schema

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

@Serializable
data class SemanticProfile(
    val snippetId: String,
    val codeHash: String,
    val code: String,
    val insights: List<SemanticInsight>,
    val rootScopes: List<ScopeNode>,
)

@Serializable
data class SemanticInsight(
    val id: String,
    val position: Range,
    val category: InsightCategory,
    val level: InsightLevel,
    val kind: InsightKind,
    val scopeChain: List<ScopeRef>,
    val data: InsightData,
    val tokenText: String,
)

@Serializable
data class ScopeRef(
    val scopeId: String,
    val kind: ScopeKind,
    val receiverType: String? = null,
    val position: Range,
)

@Serializable
enum class ScopeKind {
    FILE,
    CLASS,
    FUNCTION,
    LAMBDA,
    SCOPE_FUNCTION,
    WHEN_BRANCH,
    IF_BRANCH,
    TRY_BLOCK,
    CATCH_BLOCK,
}

@Serializable
data class ScopeNode(
    val ref: ScopeRef,
    val children: List<ScopeNode>,
    val insights: List<String>,
)

@Serializable
data class Range(
    val from: Position,
    val to: Position,
)

@Serializable
data class Position(
    val line: Int,
    val col: Int,
)

@Serializable
enum class InsightCategory {
    TYPE_INFERENCE,
    NULLABILITY,
    SMART_CASTS,
    SCOPING,
    EXTENSIONS,
    LAMBDAS,
    OVERLOADS,
}

@Serializable
enum class InsightLevel {
    OFF,
    HIGHLIGHTS,
    ALL,
}

@Serializable
enum class InsightKind {
    INFERRED_TYPE,
    EXPLICIT_TYPE,
    GENERIC_ARGUMENT_INFERRED,
    NULLABLE_TYPE,
    PLATFORM_TYPE,
    NULL_SAFE_CALL,
    ELVIS_OPERATOR,
    NOT_NULL_ASSERTION,
    IS_CHECK_CAST,
    WHEN_BRANCH_CAST,
    NEGATED_CHECK_EXIT,
    NULL_CHECK_CAST,
    RECEIVER_CHANGE,
    IMPLICIT_THIS,
    SCOPE_FUNCTION_ENTRY,
    EXTENSION_FUNCTION_CALL,
    EXTENSION_PROPERTY_ACCESS,
    MEMBER_VS_EXTENSION_RESOLUTION,
    LAMBDA_PARAMETER_INFERRED,
    LAMBDA_RETURN_INFERRED,
    SAM_CONVERSION,
    TRAILING_LAMBDA,
    OVERLOAD_RESOLVED,
    DEFAULT_ARGUMENT_USED,
    NAMED_ARGUMENT_REORDER,
}

@Serializable
sealed interface InsightData

@Serializable
@SerialName("TypeInference")
data class TypeInferenceData(
    val inferredType: String,
    val declaredType: String? = null,
    val typeArguments: List<String>? = null,
) : InsightData

@Serializable
@SerialName("Nullability")
data class NullabilityData(
    val type: String,
    val isNullable: Boolean,
    val isPlatformType: Boolean,
    val narrowedToNonNull: Boolean,
) : InsightData

@Serializable
@SerialName("SmartCast")
data class SmartCastData(
    val originalType: String,
    val narrowedType: String,
    val evidencePosition: Range,
    val evidenceKind: String,
) : InsightData

@Serializable
@SerialName("Scoping")
data class ScopingData(
    val scopeFunction: String? = null,
    val outerReceiver: String? = null,
    val innerReceiver: String? = null,
    val itParameterType: String? = null,
) : InsightData

@Serializable
@SerialName("Extension")
data class ExtensionData(
    val functionOrProperty: String,
    val extensionReceiverType: String,
    val dispatchReceiverType: String? = null,
    val resolvedFrom: String,
    val competingMember: Boolean,
) : InsightData

@Serializable
@SerialName("Lambda")
data class LambdaData(
    val parameterTypes: List<LambdaParam>,
    val returnType: String,
    val inferredFromContext: String? = null,
    val samInterface: String? = null,
) : InsightData

@Serializable
data class LambdaParam(
    val name: String? = null,
    val type: String,
)

@Serializable
@SerialName("Overload")
data class OverloadData(
    val selectedSignature: String,
    val candidateCount: Int,
    val resolutionFactors: List<String>,
    val defaultArgumentsUsed: List<String>? = null,
) : InsightData

object SemanticProfileSerializer {
    private val json = Json {
        prettyPrint = false
        encodeDefaults = false
        classDiscriminator = "type"
    }

    fun toJson(profile: SemanticProfile): String =
        json.encodeToString(profile)

    fun fromJson(jsonString: String): SemanticProfile =
        json.decodeFromString(jsonString)
}
