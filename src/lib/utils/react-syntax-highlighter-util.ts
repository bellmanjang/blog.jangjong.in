export function parseLang(lang: string): string {
    switch (lang) {
        case "ts":
            return "typescript";
    }

    return lang;
}
