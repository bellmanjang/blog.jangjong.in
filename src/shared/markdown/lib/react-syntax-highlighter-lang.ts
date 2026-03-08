export function syntaxHighlighterLanguage(lang: string): string {
    switch (lang) {
        case "ts":
            return "typescript";
    }

    return lang;
}
