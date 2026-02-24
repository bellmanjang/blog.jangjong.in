import {
    atomOneDark,
    atomOneLight,
} from "react-syntax-highlighter/dist/esm/styles/hljs";

export function syntaxHighlighterLanguage(lang: string): string {
    switch (lang) {
        case "ts":
            return "typescript";
    }

    return lang;
}

const COLOR_LIKE_PROPS = new Set([
    "color",
    "background",
    "backgroundColor",
    "borderColor",
    "outlineColor",
    "textDecorationColor",
    "fill",
    "stroke",
]);

function isColorLikeProp(prop: string) {
    return COLOR_LIKE_PROPS.has(prop);
}

/**
 * 두개의 theme을 light-dark(light, dark)으로 병합
 */
function mergeHighlightThemesToLightDark(
    light: Record<string, React.CSSProperties>,
    dark: Record<string, React.CSSProperties>,
): Record<string, React.CSSProperties> {
    const out: Record<string, React.CSSProperties> = {};

    const selectors = new Set([...Object.keys(light), ...Object.keys(dark)]);
    for (const sel of selectors) {
        const lDecl = light[sel] ?? {};
        const dDecl = dark[sel] ?? {};
        const props = new Set([...Object.keys(lDecl), ...Object.keys(dDecl)]);

        const mergedDecl: React.CSSProperties = {};

        for (const prop of props) {
            const lHas = Object.hasOwn(lDecl, prop);
            const dHas = Object.hasOwn(dDecl, prop);
            const lVal = lDecl[prop];
            const dVal = dDecl[prop];

            // 한쪽만 있으면 그대로
            if (!lHas) {
                mergedDecl[prop] = dVal;
                continue;
            }
            if (!dHas) {
                mergedDecl[prop] = lVal;
                continue;
            }

            // 둘 다 있고 값이 같으면 그대로
            if (lVal === dVal) {
                mergedDecl[prop] = lVal;
                continue;
            }

            // color-like 아닌 값은 light를 따름
            if (!isColorLikeProp(prop)) {
                mergedDecl[prop] = lVal;
                continue;
            }

            mergedDecl[prop] = `light-dark(${lVal}, ${dVal})`;
        }

        out[sel] = mergedDecl;
    }

    return out;
}

export const lightDarkTheme = mergeHighlightThemesToLightDark(
    atomOneLight,
    atomOneDark,
);
