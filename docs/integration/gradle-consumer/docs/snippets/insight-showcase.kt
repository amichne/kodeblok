data class User(val name: String)

fun <T> wrap(value: T): List<T> = listOf(value)

fun mix(value: Int, label: String): String = "$label:$value"
fun mix(value: String, label: String): String = "$label:$value"

fun greet(name: String, title: String = "Mx"): String = "$title $name"

fun insightShowcase(any: Any?, maybe: String?) {
    val inferred = 42
    val explicit: String = "ok"
    val nullable: String? = null

    val safeLength = maybe?.length
    val fallback = maybe ?: "default"
    val forced = maybe!!

    val mapped = wrap(inferred)
    val itemList = listOf(1, 2, 3)
    val incremented = itemList.map { it + 1 }
    val asText = itemList.map { value: Int -> value.toString() }
    val lastIndex = itemList.lastIndex

    if (any is String) {
        println(any.length)
    }
    if (any !is String) return

    val scoped = maybe?.let { it.length } ?: 0

    val overload = mix(1, "id")
    val reordered = mix(label = "rank", value = 2)
    val titled = greet("Ada")

    println("$explicit $nullable $safeLength $forced $mapped $incremented $asText $lastIndex $scoped $overload $reordered $titled")
}
