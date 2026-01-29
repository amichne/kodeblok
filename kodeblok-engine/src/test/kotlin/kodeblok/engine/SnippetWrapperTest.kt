package kodeblok.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class SnippetWrapperTest {
    @Test
    fun wrapsSnippetWithImportsMetadata() {
        val snippet = NormalizedSnippet(
            snippetId = "wrapped",
            code = "println(User())",
            origin = OriginLocation("inline", 1, 1),
            imports = listOf("com.acme.User")
        )

        val wrapped = SnippetWrapper().wrap(snippet)

        assertTrue(wrapped.code.contains("import com.acme.User"))
        assertEquals(3, wrapped.lineMap.lineOffset)
        assertEquals(WrapperKind.WRAPPED_FUNCTION, wrapped.kind)
    }

    @Test
    fun prefixesImportsForFileLevelSnippetWithoutPackage() {
        val snippet = NormalizedSnippet(
            snippetId = "snippet",
            code = "val user = User()",
            origin = OriginLocation("inline", 1, 1),
            imports = listOf("com.acme.User")
        )

        val wrapped = SnippetWrapper().wrap(snippet)

        assertTrue(wrapped.code.contains("import com.acme.User"))
        assertEquals(1, wrapped.lineMap.lineOffset)
        assertEquals(WrapperKind.FILE_LEVEL, wrapped.kind)
    }

    @Test
    fun rejectsImportsMetadataWhenPackagePresent() {
        val snippet = NormalizedSnippet(
            snippetId = "file",
            code = "package demo\nfun demo() = 1",
            origin = OriginLocation("inline", 1, 1),
            imports = listOf("com.acme.User")
        )

        assertFailsWith<HoverEngineException> {
            SnippetWrapper().wrap(snippet)
        }
    }

    @Test
    fun rejectsInlineImportWithoutDeclaration() {
        val snippet = NormalizedSnippet(
            snippetId = "bad",
            code = "import com.acme.User\nUser()",
            origin = OriginLocation("inline", 1, 1)
        )

        assertFailsWith<HoverEngineException> {
            SnippetWrapper().wrap(snippet)
        }
    }
}
