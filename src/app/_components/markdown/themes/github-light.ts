export default {
    // Base block (kept same structural props as your react-markdown payload example)
    hljs: {
        display: "block",
        overflowX: "auto",
        padding: "0.5em",
        background: "#ffffff",
        color: "#24292e",
    },

    // Comments / quotes
    "hljs-comment": { color: "#6a737d" },
    "hljs-quote": { color: "#22863a" },

    // Keywords
    "hljs-keyword": { color: "#d73a49" },
    "hljs-meta .hljs-keyword": { color: "#d73a49" },

    // Selectors
    "hljs-selector-tag": { color: "#22863a" },
    "hljs-selector-id": { color: "#005cc5" },
    "hljs-selector-class": { color: "#005cc5" },
    "hljs-selector-attr": { color: "#005cc5" },
    "hljs-selector-pseudo": { color: "#22863a" },

    // Numbers / strings / literals / regexp
    "hljs-number": { color: "#005cc5" },
    "hljs-string": { color: "#032f62" },
    "hljs-meta .hljs-meta-string": { color: "#032f62" }, // mapped from `.hljs-meta .hljs-string`
    "hljs-literal": { color: "#005cc5" },
    "hljs-doctag": { color: "#d73a49" },
    "hljs-regexp": { color: "#032f62" },

    // Titles / sections / names
    "hljs-title": { color: "#6f42c1" },
    "hljs-section": { color: "#005cc5", fontWeight: "bold" },
    "hljs-name": { color: "#22863a" },

    // Attributes / vars / types
    "hljs-attribute": { color: "#005cc5" },
    "hljs-attr": { color: "#005cc5" },
    "hljs-variable": { color: "#005cc5" },
    "hljs-template-variable": { color: "#d73a49" },
    "hljs-class .hljs-title": { color: "#6f42c1" },
    "hljs-type": { color: "#d73a49" },

    // Symbols / bullets / subst / meta
    "hljs-symbol": { color: "#e36209" },
    "hljs-bullet": { color: "#735c0f" },
    "hljs-subst": { color: "#24292e" },
    "hljs-meta": { color: "#005cc5" },

    // Additions / deletions
    "hljs-addition": { color: "#22863a", backgroundColor: "#f0fff4" },
    "hljs-deletion": { color: "#b31d28", backgroundColor: "#ffeef0" },

    // Built-ins / links
    "hljs-built_in": { color: "#e36209" },
    "hljs-link": { color: "#24292e" }, // not styled in GitHub CSS (ignored), so fall back to base text

    // Formula / emphasis / strong
    "hljs-formula": { color: "#6a737d" },
    "hljs-emphasis": { fontStyle: "italic", color: "#24292e" },
    "hljs-strong": { fontWeight: "bold", color: "#24292e" },
};
